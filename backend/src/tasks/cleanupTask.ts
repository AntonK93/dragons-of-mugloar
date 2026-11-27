import type { AutoPlayGames } from "../cache/autoPlayGames";
import { logger } from "../tools/logger";

const retentionMs = 24 * 60 * 60 * 1_000; // 24 hours in milliseconds

export const cleanupTask = async (autoPlayGames: AutoPlayGames): Promise<void> => {
    const cutoff = Date.now() - retentionMs;

    for (const [gameId, actions] of autoPlayGames.getAll()) {
        const lastAction = actions[actions.length - 1];
        if (!lastAction) {
            autoPlayGames.delete(gameId);
            continue;
        }
        if (lastAction.lives > 0 && lastAction.type !== "gameOver") {
            continue;
        }
        const completedAt = Date.parse(lastAction.timestamp);
        if (Number.isNaN(completedAt)) {
            logger.error(`Invalid completion timestamp for game ${gameId}`);
            continue;
        }
        if (completedAt <= cutoff) {
            autoPlayGames.delete(gameId);
        }
    }
};
