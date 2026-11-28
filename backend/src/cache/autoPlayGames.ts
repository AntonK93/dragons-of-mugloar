import { InternalServerError, NotFoundError } from "../errors/errors.js";
import { AutoPlayActionLog } from "../types/autoplay.js";

type GameAction = {
    lastUpdate: number;
    status: "active" | "gameOver";
    actionLogs: AutoPlayActionLog[];
};

export class AutoPlayGamesStore {
    private readonly games = new Map<string, GameAction>();

    add(gameId: string, initialLog: AutoPlayActionLog): void {
        if (this.games.has(gameId)) {
            throw new InternalServerError(`Game already exists for gameId: ${gameId}`);
        }

        this.games.set(gameId, {
            lastUpdate: initialLog.timestamp,
            status: initialLog.type === "gameOver" ? "gameOver" : "active",
            actionLogs: [{ ...initialLog }],
        });
    }

    delete(gameId: string): boolean {
        return this.games.delete(gameId);
    }

    setStatus(gameId: string, status: GameAction["status"]): void {
        const game = this.games.get(gameId);
        if (!game) {
            throw new NotFoundError(`No game found for gameId: ${gameId}`);
        }
        this.games.set(gameId, {
            ...game,
            lastUpdate: Date.now(),
            status,
        });
    }

    addActionLog(gameId: string, action: AutoPlayActionLog): void {
        const game = this.games.get(gameId);
        if (!game) {
            throw new NotFoundError(`No game found for gameId: ${gameId}`);
        }
        this.games.set(gameId, {
            ...game,
            lastUpdate: Date.now(),
            status: action.type === "gameOver" ? "gameOver" : game.status,
            actionLogs: [...game.actionLogs, { ...action }],
        });
    }

    get(gameId: string): GameAction | undefined {
        const game = this.games.get(gameId);
        if (!game) {
            throw new NotFoundError(`No game found for gameId: ${gameId}`);
        }
        return structuredClone(game);
    }

    getActiveGames(): [string, GameAction][] {
        const activeGames = Array.from(this.games.entries()).filter(
            ([, game]): boolean => game.status === "active",
        );
        return structuredClone(activeGames);
    }

    getAll(): [string, GameAction][] {
        const games = Array.from(this.games, ([gameId, game]): [string, GameAction] => [
            gameId,
            game,
        ]);
        return structuredClone(games);
    }
}

export const createAutoPlayGamesStore = (): AutoPlayGamesStore => {
    return new AutoPlayGamesStore();
};
