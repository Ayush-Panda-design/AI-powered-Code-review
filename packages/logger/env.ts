export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  LOGGER_LEVEL: process.env.LOGGER_LEVEL as "error" | "info" | "debug" | undefined,
};
