import type { AutoPlayGamesStore } from "../cache/autoPlayGames.js";

const retentionMs = 24 * 60 * 60 * 1_000; // 24 hours in milliseconds

// as we have a front end part that can fetch history of game
// i added a retention policy to clean up old completed games
export const cleanupTask = async (autoPlayGamesStore: AutoPlayGamesStore): Promise<void> => {
    const cutoff = Date.now() - retentionMs;

    for (const [gameId, game] of autoPlayGamesStore.getAll()) {
        if (game.status === "active") {
            continue;
        }
        const completedAt = game.lastUpdate;
        if (completedAt <= cutoff) {
            autoPlayGamesStore.delete(gameId);
        }
    }
};
