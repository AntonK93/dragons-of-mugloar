import { logger } from "../tools/logger";
import { InternalServerError, NotFoundError } from "../errors/errors";
import { AutoPlayActionLog } from "../types/autoplay";

export class AutoPlayGames {
    private readonly games = new Map<string, AutoPlayActionLog[]>();

    add(gameId: string, initialLog: AutoPlayActionLog): void {
        if (this.games.has(gameId)) {
            throw new InternalServerError(`Game already exists for gameId: ${gameId}`);
        }

        this.games.set(gameId, [initialLog]);
    }

    delete(gameId: string): boolean {
        return this.games.delete(gameId);
    }

    addActionLog(gameId: string, action: AutoPlayActionLog): void {
        const game = this.games.get(gameId);
        if (!game) {
            throw new NotFoundError(`No game found for gameId: ${gameId}`);
        }
        logger.info(action, `Added log for game ${gameId}`);
        game.push({ ...action });
    }

    get(gameId: string): AutoPlayActionLog[] | undefined {
        const game = this.games.get(gameId);
        if (!game) {
            throw new NotFoundError(`No game found for gameId: ${gameId}`);
        }
        return structuredClone(game);
    }

    getAll(): [string, AutoPlayActionLog[]][] {
        return structuredClone(Array.from(this.games.entries()));
    }
}
