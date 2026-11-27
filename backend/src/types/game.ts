import type { z } from "zod";
import {
    buyItemResponseSchema,
    itemsResponseSchema,
    messagesResponseSchema,
    reputationResponseSchema,
    solveMessageResponseSchema,
    startGameResponseSchema,
} from "../schemas/gameApi";

export type StartGameResponse = z.infer<typeof startGameResponseSchema>;
export type InvestigateReputationResponse = z.infer<typeof reputationResponseSchema>;
export type GetMessagesResponse = z.infer<typeof messagesResponseSchema>;
export type SolveMessageResponse = z.infer<typeof solveMessageResponseSchema>;
export type GetItemsResponse = z.infer<typeof itemsResponseSchema>;
export type BuyItemResponse = z.infer<typeof buyItemResponseSchema>;
