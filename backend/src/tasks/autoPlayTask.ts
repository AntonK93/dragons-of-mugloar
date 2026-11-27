import type { AutoPlayGames } from "../cache/autoPlayGames";
import { InternalServerError } from "../errors/errors";
import { GAME_OVER_STATUS, GameApiError } from "../errors/gameApiError";
import type { AutoPlayService } from "../services/autoPlay";
import type { GameStatistics } from "../services/gameStatistics";
import { logger } from "../tools/logger";

export const autoPlayTask = async (
    autoPlay: AutoPlayService,
    autoPlayGames: AutoPlayGames,
    statistics: GameStatistics,
): Promise<void> => {
    await Promise.allSettled(
        autoPlayGames.getAll().map(async ([gameId, gameLog]): Promise<void> => {
            try {
                await autoPlay.playTurn(gameId, gameLog);
            } catch (error) {
                logger.error(error, `Failed to play turn for game ${gameId}`);
                if (error instanceof GameApiError && error.apiStatus === GAME_OVER_STATUS) {
                    const lastAction = gameLog[gameLog.length - 1];
                    if (!lastAction) {
                        throw new InternalServerError(
                            `Cannot mark game ${gameId} unavailable without an action log`,
                        );
                    }
                    autoPlayGames.addActionLog(gameId, {
                        ...lastAction,
                        type: "gameOver",
                        result: "Your adventure has come to an end.",
                        timestamp: new Date().toISOString(),
                    });
                    statistics.recordCompletedGame(gameId, lastAction.score);
                }
            }
        }),
    );
};
