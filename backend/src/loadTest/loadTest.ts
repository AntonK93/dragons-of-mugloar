import { parseArgs } from "node:util";
import { createGameApi } from "../services/gameApi.js";
import { createAutoPlayService, startAutoPlayGame } from "../services/autoPlay.js";
import { createAutoPlayGamesStore } from "../cache/autoPlayGames.js";
import { autoPlayTask } from "../tasks/autoPlayTask.js";
import { createStatistics } from "../services/gameStatistics.js";
import { logger } from "../tools/logger.js";

export const parseGameCount = (args: string[]): number => {
    const { values } = parseArgs({
        args,
        options: { gameCount: { type: "string" } },
    });
    const value = values.gameCount;
    if (!value || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
        throw new Error("--gameCount must be a positive safe integer");
    }
    return Number(value);
};

export const loadTest = async (gameCount: number): Promise<void> => {
    const gameApi = createGameApi();
    const autoPlayGamesStore = createAutoPlayGamesStore();
    const autoPlayService = createAutoPlayService(gameApi, autoPlayGamesStore);
    const gameStatistics = createStatistics();

    logger.info(`Starting load test with ${gameCount} games`);
    const results = await Promise.allSettled(
        Array.from({ length: gameCount }, (): ReturnType<typeof startAutoPlayGame> => {
            return startAutoPlayGame(gameApi, autoPlayGamesStore);
        }),
    );
    let failed = false;
    for (const [i, result] of results.entries()) {
        if (result.status === "rejected") {
            failed = true;
            logger.error({ err: result.reason }, `Failed to start game ${i + 1} stopping script`);
        }
    }
    if (failed) {
        return;
    }
    logger.info(`All games ${gameCount} started successfully`);

    // run turns sequentially for each cycle
    let cycleCount = 0;
    logger.info(`Running until all games finish`);
    while (autoPlayGamesStore.getActiveGames().length !== 0) {
        cycleCount++;
        const batchGameCount = autoPlayGamesStore.getActiveGames().length;
        logger.info(`Starting cycle ${cycleCount} for ${batchGameCount} games in the batch`);
        await autoPlayTask(autoPlayService, autoPlayGamesStore, gameStatistics);
    }
    logger.info(`Completed ${cycleCount} cycles for ${gameCount} games`);
    logger.info(`Statistics available in game-statistic.json file`);
};
