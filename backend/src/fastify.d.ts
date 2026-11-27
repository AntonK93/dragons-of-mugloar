import type { GameApi } from "./services/gameApi";
import type { TaskScheduler } from "./tasks/scheduler";
import type { AutoPlayGames } from "./cache/autoPlayGames";
import type { GameStatistics } from "./services/gameStatistics";

declare module "fastify" {
    interface FastifyInstance {
        gameApi: GameApi;
        scheduler: TaskScheduler;
        autoPlayGames: AutoPlayGames;
        statistics: GameStatistics;
    }
}
