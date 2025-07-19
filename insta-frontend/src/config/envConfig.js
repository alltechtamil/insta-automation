export const BACKEND_API_URL = "https://insta-backend-automation-178521a811be.herokuapp.com";

export function assertEnv() {
  if (!BACKEND_API_URL) {
    throw new Error('Missing BACKEND_API_URL — check your envConfig file!');
  }
}

assertEnv();