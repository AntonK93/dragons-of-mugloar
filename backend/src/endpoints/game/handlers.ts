import type { FastifyReply, FastifyRequest } from "fastify";
import { GameParams, SolveMessageParams, BuyItemParams } from "../../types/endpoints";

export const startGame = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const gameData = await request.server.gameApi.startGame();
    reply.code(200).send(gameData);
};

export const investigateReputation = async (
    request: FastifyRequest<{ Params: GameParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId } = request.params;
    const reputation = await request.server.gameApi.investigateReputation(gameId);
    reply.code(200).send(reputation);
};

export const getMessages = async (
    request: FastifyRequest<{ Params: GameParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId } = request.params;
    const messages = await request.server.gameApi.getMessages(gameId);
    reply.code(200).send(messages);
};

export const solveMessage = async (
    request: FastifyRequest<{ Params: SolveMessageParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId, adId } = request.params;
    const result = await request.server.gameApi.solveMessage(gameId, adId);
    reply.code(200).send(result);
};

export const getItems = async (
    request: FastifyRequest<{ Params: GameParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId } = request.params;
    const items = await request.server.gameApi.getItems(gameId);
    reply.code(200).send(items);
};

export const buyItem = async (
    request: FastifyRequest<{ Params: BuyItemParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId, itemId } = request.params;
    const result = await request.server.gameApi.buyItem(gameId, itemId);
    reply.code(200).send(result);
};

export const startAutoPlay = async (
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    const gameData = await request.server.gameApi.startGame();
    request.server.autoPlayGames.add(gameData.gameId, {
        type: "initial",
        result: "Game started",
        turn: gameData.turn,
        gold: gameData.gold,
        stateReputation: 0,
        peopleReputation: 0,
        underworldReputation: 0,
        score: gameData.score,
        lives: gameData.lives,
        timestamp: new Date().toISOString(),
    });
    reply.code(200).send(gameData);
};

export const getAutoPlayStatus = async (
    request: FastifyRequest<{ Params: GameParams }>,
    reply: FastifyReply,
): Promise<void> => {
    const { gameId } = request.params;
    const items = request.server.autoPlayGames.get(gameId);
    reply.code(200).send(items);
};
