import { readdir } from "fs/promises";
import { isAbsolute, relative, resolve } from "path";
import type { Dirent } from "fs";
import type { MentionCandidate } from "./types";

const CURRENT_DIRECTORY = process.cwd();
const IGNORE_DIRECTORY = new Set(["node_modules"]);
const MAX_MENTION_CANDIDATES = 32;
const MIN_RECURSIVE_QUERY_LENGTH = 2;

type RankedMentionCandidate = MentionCandidate & {
  score: number;
};

const isWithinCurrentDirectory = (path: string) => {
  const relativePath = relative(CURRENT_DIRECTORY, path);
  return !relativePath.startsWith("..") && !isAbsolute(relativePath);
};

const normalizeMentionQuery = (query: string) => {
  const normalizedSlashes = query.replaceAll("\\", "/");
  return normalizedSlashes.startsWith("./")
    ? normalizedSlashes.slice(2)
    : normalizedSlashes;
};

const shouldIncludeEntry = (name: string, showHiddenEntries: boolean) => {
  return showHiddenEntries || !name.startsWith(".");
};

const toMentionCandidate = (
  entry: Dirent,
  directoryPath: string,
): MentionCandidate => {
  const path = directoryPath ? `${directoryPath}/${entry.name}` : entry.name;
  const kind: MentionCandidate["kind"] = entry.isDirectory()
    ? "directory"
    : "file";

  return {
    path: kind === "directory" ? `${path}/` : path,
    kind,
  };
};

const compareRankedCandidates = (
  left: RankedMentionCandidate,
  right: RankedMentionCandidate,
) => {
  if (left.score !== right.score) {
    return left.score - right.score;
  }

  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }

  return left.path.localeCompare(right.path);
};

const getDirectMatchScore = (name: string, query: string) => {
  if (query === "") {
    return 0;
  }

  const lowercaseName = name.toLowerCase();
  const lowercaseQuery = query.toLowerCase();

  if (lowercaseName === lowercaseQuery) {
    return 0;
  }

  if (lowercaseName.startsWith(lowercaseQuery)) {
    return 1;
  }

  if (lowercaseName.includes(lowercaseQuery)) {
    return 2;
  }

  return null;
};

const getRecursiveMatchScore = (candidate: MentionCandidate, query: string) => {
  const normalizedCandidatePath = candidate.path.endsWith("/")
    ? candidate.path.slice(0, -1)
    : candidate.path;
  const lowercasePath = normalizedCandidatePath.toLowerCase();
  const lowercaseName = lowercasePath.split("/").at(-1) ?? lowercasePath;
  const lowercaseQuery = query.toLowerCase();
  const pathSegments = lowercasePath.split("/");

  if (lowercasePath === lowercaseQuery) {
    return 0;
  }

  if (lowercasePath.startsWith(lowercaseQuery)) {
    return 1;
  }

  if (lowercaseName === lowercaseQuery) {
    return 2;
  }

  if (lowercaseName.startsWith(lowercaseQuery)) {
    return 3;
  }

  if (pathSegments.some((segment) => segment.startsWith(lowercaseQuery))) {
    return 4;
  }

  if (lowercaseName.includes(lowercaseQuery)) {
    return 5;
  }

  if (lowercasePath.includes(lowercaseQuery)) {
    return 6;
  }

  return null;
};

const collectRecursiveMatches = async ({
  searchRoot,
  searchRootPath,
  query,
  showHiddenEntries,
}: {
  searchRoot: string;
  searchRootPath: string;
  query: string;
  showHiddenEntries: boolean;
}) => {
  const matches: RankedMentionCandidate[] = [];

  const visit = async (
    absoluteDirectory: string,
    directoryPath: string,
  ): Promise<void> => {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORE_DIRECTORY.has(entry.name)) continue;
      if (!shouldIncludeEntry(entry.name, showHiddenEntries)) continue;

      const candidate = toMentionCandidate(entry, directoryPath);
      const score = getRecursiveMatchScore(candidate, query);
      if (score !== null) {
        matches.push({ ...candidate, score });
      }

      if (entry.isDirectory()) {
        await visit(resolve(absoluteDirectory, entry.name), candidate.path.slice(0, -1));
      }
    }
  };

  await visit(searchRoot, searchRootPath);
  return matches;
};

const toSortedCandidates = (candidates: RankedMentionCandidate[]) => {
  const dedupedCandidates = new Map<string, RankedMentionCandidate>();

  for (const candidate of candidates) {
    const currentCandidate = dedupedCandidates.get(candidate.path);
    if (!currentCandidate || compareRankedCandidates(candidate, currentCandidate) < 0) {
      dedupedCandidates.set(candidate.path, candidate);
    }
  }

  return [...dedupedCandidates.values()]
    .sort(compareRankedCandidates)
    .slice(0, MAX_MENTION_CANDIDATES)
    .map(({ path, kind }) => ({ path, kind }));
};

export const getMentionCandidates = async (
  query: string,
): Promise<MentionCandidate[]> => {
  const normalizedQuery = normalizeMentionQuery(query);
  if (normalizedQuery.startsWith("/")) {
    return [];
  }

  const hasTrailingSlash = normalizedQuery.endsWith("/");
  const lastSlashIndex = hasTrailingSlash
    ? normalizedQuery.length - 1
    : normalizedQuery.lastIndexOf("/");

  const directoryPath = hasTrailingSlash
    ? normalizedQuery.slice(0, -1)
    : lastSlashIndex === -1
      ? ""
      : normalizedQuery.slice(0, lastSlashIndex);

  const nameQuery = hasTrailingSlash
    ? ""
    : lastSlashIndex === -1
      ? normalizedQuery
      : normalizedQuery.slice(lastSlashIndex + 1);

  const showHiddenEntries = nameQuery.startsWith(".");
  const rankedCandidates: RankedMentionCandidate[] = [];
  const directDirectory = resolve(CURRENT_DIRECTORY, directoryPath || ".");

  if (isWithinCurrentDirectory(directDirectory)) {
    try {
      const entries = await readdir(directDirectory, { withFileTypes: true });

      for (const entry of entries) {
        if (IGNORE_DIRECTORY.has(entry.name)) continue;
        if (!shouldIncludeEntry(entry.name, showHiddenEntries)) continue;

        const score = getDirectMatchScore(entry.name, nameQuery);
        if (score === null) continue;

        rankedCandidates.push({
          ...toMentionCandidate(entry, directoryPath),
          score,
        });
      }
    } catch {
      // Fall back to a recursive project search below.
    }
  }

  const canSearchRecursively =
    !hasTrailingSlash && (
      directoryPath !== '' ? nameQuery.length >=1 : nameQuery.length >= MIN_RECURSIVE_QUERY_LENGTH
    )

  if (!canSearchRecursively) {
    return toSortedCandidates(rankedCandidates);
  }

  const recursiveSearchRoot = isWithinCurrentDirectory(directDirectory)
    ? directDirectory
    : CURRENT_DIRECTORY;
  const recursiveSearchPath = isWithinCurrentDirectory(directDirectory)
    ? directoryPath
    : "";
  const recursiveQuery = recursiveSearchPath === "" ? normalizedQuery : nameQuery;

  try {
    rankedCandidates.push(
      ...(await collectRecursiveMatches({
        searchRoot: recursiveSearchRoot,
        searchRootPath: recursiveSearchPath,
        query: recursiveQuery,
        showHiddenEntries,
      })),
    );
  } catch {
    return toSortedCandidates(rankedCandidates);
  }

  return toSortedCandidates(rankedCandidates);
};
