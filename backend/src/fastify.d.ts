import type { GameApi } from "./services/gameApi.js";
import type { TaskScheduler } from "./tasks/scheduler.js";
import type { AutoPlayGamesStore } from "./cache/autoPlayGames.js";
import type { GameStatistics } from "./services/gameStatistics.js";

declare module "fastify" {
    interface FastifyInstance {
        gameApi: GameApi;
        scheduler: TaskScheduler;
        autoPlayGamesStore: AutoPlayGamesStore;
        statistics: GameStatistics;
    }
}
