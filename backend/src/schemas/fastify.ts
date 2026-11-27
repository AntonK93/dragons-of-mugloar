import { FastifySchema } from "fastify/types/schema";

const alphanumericParam = { type: "string", pattern: "^[a-zA-Z0-9]+$" };
const stringParam = { type: "string", pattern: "^[a-zA-Z]+$" };

export const gameSchema = {
    params: {
        type: "object",
        properties: { gameId: alphanumericParam },
        required: ["gameId"],
    },
} satisfies FastifySchema;

export const solveMessageSchema = {
    params: {
        type: "object",
        properties: { gameId: alphanumericParam, adId: alphanumericParam },
        required: ["gameId", "adId"],
    },
} satisfies FastifySchema;

export const buyItemSchema = {
    params: {
        type: "object",
        properties: { gameId: alphanumericParam, itemId: stringParam },
        required: ["gameId", "itemId"],
    },
} satisfies FastifySchema;
