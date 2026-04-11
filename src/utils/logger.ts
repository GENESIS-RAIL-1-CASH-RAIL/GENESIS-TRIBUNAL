// GENESIS-TRIBUNAL — Logger utility
// T19 Wave 5: utils/logger.ts

const PREFIX = "[tribunal]";

export const logger = {
  info: (...args: unknown[]): void => {
    console.log(PREFIX, ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(PREFIX, ...args);
  },
  error: (...args: unknown[]): void => {
    console.error(PREFIX, ...args);
  },
  debug: (...args: unknown[]): void => {
    if (process.env.TRIBUNAL_DEBUG === "true") {
      console.debug(PREFIX, "[debug]", ...args);
    }
  },
};
