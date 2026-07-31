export type MentionCandidate = {
  path: string;
  kind: "file" | "directory";
};

export type MentionMatch = {
  start: number;
  end: number;
  query: string;
};
