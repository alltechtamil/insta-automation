export const BACKEND_API_URL = "https://site--instaauto--qzlxcf8fbwfk.code.run";

export function assertEnv() {
  if (!BACKEND_API_URL) {
    throw new Error('Missing BACKEND_API_URL — check your envConfig file!');
  }
}

assertEnv();