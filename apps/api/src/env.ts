export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.API_PORT ?? "8000",
  BASE_URL: process.env.API_BASE_URL ?? "http://localhost:8000",
};
