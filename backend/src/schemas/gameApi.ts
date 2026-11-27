import { z } from "zod";
export const startGameResponseSchema = z.object({
    gameId: z.string().min(1),
    lives: z.number(),
    gold: z.number(),
    level: z.number(),
    score: z.number(),
    highScore: z.number(),
    turn: z.number(),
});

export const reputationResponseSchema = z.object({
    people: z.number(),
    state: z.number(),
    underworld: z.number(),
});

export const messagesResponseSchema = z.array(
    z.object({
        adId: z.string().min(1),
        message: z.string(),
        reward: z.number(),
        expiresIn: z.number(),
        encrypted: z.number().nullable(),
        probability: z.string(),
    }),
);

export const solveMessageResponseSchema = z.object({
    success: z.boolean(),
    lives: z.number(),
    gold: z.number(),
    score: z.number(),
    highScore: z.number(),
    turn: z.number(),
    message: z.string(),
});

export const itemsResponseSchema = z.array(
    z.object({
        id: z.string().min(1),
        name: z.string(),
        cost: z.number(),
    }),
);

export const buyItemResponseSchema = z.object({
    shoppingSuccess: z.boolean(),
    gold: z.number(),
    lives: z.number(),
    level: z.number(),
    turn: z.number(),
});
