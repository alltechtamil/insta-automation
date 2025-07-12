export const BACKEND_API_URL = "http://localhost:8080";

export function assertEnv() {
  if (!BACKEND_API_URL) {
    throw new Error('Missing BACKEND_API_URL — check your envConfig file!');
  }
}

assertEnv();
