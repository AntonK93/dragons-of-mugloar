import pino from "pino";

export const logger = pino({
    level: "debug",
    base: null,
    formatters: {
        level: (): Record<string, never> => ({}),
    },
});
