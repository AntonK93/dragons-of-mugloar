import type { Tasks } from "../types/task.js";
import type { GameApi } from "../services/gameApi.js";
import type { AutoPlayGamesStore } from "../cache/autoPlayGames.js";
import type { GameStatistics } from "../services/gameStatistics.js";
import { createAutoPlayService } from "../services/autoPlay.js";
import { autoPlayTask } from "./autoPlayTask.js";
import { cleanupTask } from "./cleanupTask.js";
import { logger } from "../tools/logger.js";

export class TaskScheduler {
    private timer: NodeJS.Timeout | undefined;
    private running = false;
    private readonly tasks: Tasks;

    constructor(
        gameApi: GameApi,
        autoPlayGamesStore: AutoPlayGamesStore,
        statistics: GameStatistics,
    ) {
        const autoPlay = createAutoPlayService(gameApi, autoPlayGamesStore);
        this.tasks = [
            {
                name: "auto-play",
                run: (): Promise<void> => autoPlayTask(autoPlay, autoPlayGamesStore, statistics),
            },
            { name: "cleanup", run: (): Promise<void> => cleanupTask(autoPlayGamesStore) },
        ];
    }

    private async runTasks(): Promise<void> {
        await Promise.allSettled(
            this.tasks.map(async (task): Promise<void> => {
                try {
                    await task.run();
                } catch (error) {
                    logger.error(error, `Task ${task.name} failed:`);
                }
            }),
        );

        if (this.running) {
            this.timer = setTimeout((): void => void this.runTasks(), 1_000);
        }
    }

    start(): void {
        if (this.running) {
            return;
        }
        this.running = true;
        void this.runTasks();
    }

    stop(): void {
        this.running = false;
        clearTimeout(this.timer);
    }
}

export const createScheduler = (
    gameApi: GameApi,
    autoPlayGames: AutoPlayGamesStore,
    statistics: GameStatistics,
): TaskScheduler => {
    return new TaskScheduler(gameApi, autoPlayGames, statistics);
};
