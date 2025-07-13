export const BACKEND_API_URL = "https://3eeec53a3317.ngrok-free.app";

export function assertEnv() {
  if (!BACKEND_API_URL) {
    throw new Error('Missing BACKEND_API_URL — check your envConfig file!');
  }
}

assertEnv();
