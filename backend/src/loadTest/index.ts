import { loadTest, parseGameCount } from "./loadTest.js";
import { logger } from "../tools/logger.js";

const main = async (): Promise<void> => {
    const gameCount = parseGameCount(process.argv.slice(2));
    await loadTest(gameCount);
};

void main().catch((error: unknown): void => {
    logger.error(error, "Load test failed");
    process.exitCode = 1;
});
