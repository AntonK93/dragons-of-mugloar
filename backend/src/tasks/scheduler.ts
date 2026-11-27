import type { Tasks } from "../types/task";
import type { GameApi } from "../services/gameApi";
import type { AutoPlayGames } from "../cache/autoPlayGames";
import type { GameStatistics } from "../services/gameStatistics";
import { AutoPlayService } from "../services/autoPlay";
import { autoPlayTask } from "./autoPlayTask";
import { cleanupTask } from "./cleanupTask";
import { logger } from "../tools/logger";

export class TaskScheduler {
    private timer: NodeJS.Timeout | undefined;
    private running = false;
    private readonly tasks: Tasks;

    constructor(gameApi: GameApi, autoPlayGames: AutoPlayGames, statistics: GameStatistics) {
        const autoPlay = new AutoPlayService(gameApi, autoPlayGames);
        this.tasks = [
            {
                name: "auto-play",
                run: (): Promise<void> => autoPlayTask(autoPlay, autoPlayGames, statistics),
            },
            { name: "cleanup", run: (): Promise<void> => cleanupTask(autoPlayGames) },
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
