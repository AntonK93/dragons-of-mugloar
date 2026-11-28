import type { AutoPlayGamesStore } from "../cache/autoPlayGames.js";
import { InternalServerError } from "../errors/errors.js";
import { GAME_OVER_STATUS, GameApiError } from "../errors/gameApiError.js";
import type { AutoPlayService } from "../services/autoPlay.js";
import type { GameStatistics } from "../services/gameStatistics.js";
import { logger } from "../tools/logger.js";

export const autoPlayTask = async (
    autoPlay: AutoPlayService,
    autoPlayGamesStore: AutoPlayGamesStore,
    statistics: GameStatistics,
): Promise<void> => {
    await Promise.allSettled(
        autoPlayGamesStore.getActiveGames().map(async ([gameId, game]): Promise<void> => {
            const gameLog = game.actionLogs;
            try {
                await autoPlay.playTurn(gameId, gameLog);
            } catch (error) {
                logger.error(error, `Failed to play turn for game ${gameId}`);
                if (error instanceof GameApiError && error.apiStatus === GAME_OVER_STATUS) {
                    autoPlayGamesStore.setStatus(gameId, "gameOver");
                    const lastAction = gameLog[gameLog.length - 1];
                    if (!lastAction) {
                        throw new InternalServerError(
                            `Cannot mark game ${gameId} unavailable without an action log`,
                        );
                    }
                    statistics.recordCompletedGame(gameId, lastAction.score);
                }
            }
        }),
    );
};
