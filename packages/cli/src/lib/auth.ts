import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlink,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type Authdata = {
  token: string;
};

const AUTH_DIR = join(homedir(), ".codesama");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

export const getAuthData = (): Authdata | null => {
  try {
    const data = readFileSync(AUTH_FILE, "utf-8");
    const parsedData = JSON.parse(data) as Partial<Authdata>;
    return typeof parsedData.token === "string"
      ? { token: parsedData.token }
      : null;
  } catch {
    return null;
  }
};

export const saveAuthData = (data: Authdata) => {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { mode: 0o700 });
  }
  writeFileSync(AUTH_FILE, JSON.stringify(data), { mode: 0o600 });
};

export const clearAuth = () => {
  try {
    unlinkSync(AUTH_FILE);
  } catch {}
};


