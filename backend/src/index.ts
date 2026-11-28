import Fastify, { LogController } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./errors/errorHandler.js";
import { schemaErrorFormatter } from "./errors/validationError.js";
import { gameRoutes } from "./endpoints/game/routes.js";
import { createScheduler } from "./tasks/scheduler.js";
import { createGameApi } from "./services/gameApi.js";
import { AutoPlayGamesStore } from "./cache/autoPlayGames.js";
import { createStatistics } from "./services/gameStatistics.js";
import { logger } from "./tools/logger.js";

const app = Fastify({
    loggerInstance: logger,
    logController: new LogController({ disableRequestLogging: true }),
    schemaErrorFormatter,
});
const port = process.env.PORT || 3000;

const start = async (): Promise<void> => {
    app.register(cors, { origin: config.frontendOrigins });
    app.decorate("gameApi", createGameApi());
    app.decorate("autoPlayGamesStore", new AutoPlayGamesStore());
    app.decorate("statistics", createStatistics());
    app.decorate("scheduler", createScheduler(app.gameApi, app.autoPlayGamesStore, app.statistics));
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

void start().catch((error: unknown): void => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
});
