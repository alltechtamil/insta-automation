export const BACKEND_API_URL = "https://pub-filme-biz-cycling.trycloudflare.com";

export function assertEnv() {
  if (!BACKEND_API_URL) {
    throw new Error('Missing BACKEND_API_URL — check your envConfig file!');
  }
}

assertEnv();