import Fastify, { LogController } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import { schemaErrorFormatter } from "./errors/validationError";
import { gameRoutes } from "./endpoints/game/routes";
import { TaskScheduler } from "./tasks/scheduler";
import { FetchClientBuilder } from "./tools/fetchClient";
import { GameApi } from "./services/gameApi";
import { AutoPlayGames } from "./cache/autoPlayGames";
import { GameStatistics } from "./services/gameStatistics";
import { resolve } from "node:path";
import { GameApiError } from "./errors/gameApiError";
import { logger } from "./tools/logger";

export const app = Fastify({
    loggerInstance: logger,
    logController: new LogController({ disableRequestLogging: true }),
    schemaErrorFormatter,
});
const port = process.env.PORT || 3000;

const start = async (): Promise<void> => {
    app.register(cors, { origin: config.frontendOrigins });
    app.decorate("gameApi", createGameApi());
    app.decorate("autoPlayGames", new AutoPlayGames());
    app.decorate("statistics", createStatistics());
    app.decorate("scheduler", createScheduler());
    app.register(gameRoutes);
    app.setNotFoundHandler(notFoundHandler);
    app.setErrorHandler(errorHandler);
    app.addHook("onClose", async (): Promise<void> => {
        app.scheduler.stop();
    });
    const address = await app.listen({ port: Number(port), host: "0.0.0.0" });
    app.scheduler.start();
    console.log(`Server listening at ${address}`);
};

const createGameApi = (): GameApi => {
    const client = new FetchClientBuilder()
        .setBaseUrl(config.gameApiUrl)
        .setErrorConstructor(GameApiError)
        .createClient();
    return new GameApi(client);
};

const createScheduler = (): TaskScheduler => {
    return new TaskScheduler(app.gameApi, app.autoPlayGames, app.statistics);
};

const createStatistics = (): GameStatistics => {
    return new GameStatistics(resolve(__dirname, config.statisticsPath));
};

void start().catch((error: unknown): void => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
});
