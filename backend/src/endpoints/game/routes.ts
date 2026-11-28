import type { FastifyInstance } from "fastify";
import {
    startGame,
    investigateReputation,
    getMessages,
    solveMessage,
    getItems,
    buyItem,
    startAutoPlay,
    getAutoPlayStatus,
} from "./handlers.js";
import { buyItemSchema, gameSchema, solveMessageSchema } from "../../schemas/fastify.js";

export const gameRoutes = (fastify: FastifyInstance): void => {
    fastify.post("/game/start", startGame);
    fastify.post(
        "/game/:gameId/investigate/reputation",
        { schema: gameSchema },
        investigateReputation,
    );
    fastify.get("/game/:gameId/messages", { schema: gameSchema }, getMessages);
    fastify.post("/game/:gameId/solve/:adId", { schema: solveMessageSchema }, solveMessage);
    fastify.get("/game/:gameId/shop", { schema: gameSchema }, getItems);
    fastify.get("/game/:gameId/shop/buy/:itemId", { schema: buyItemSchema }, buyItem);

    fastify.post("/game/auto-play", startAutoPlay);
    fastify.get("/game/:gameId/auto-play", { schema: gameSchema }, getAutoPlayStatus);
};
