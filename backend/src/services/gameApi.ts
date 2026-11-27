import {
    buyItemResponseSchema,
    itemsResponseSchema,
    messagesResponseSchema,
    reputationResponseSchema,
    solveMessageResponseSchema,
    startGameResponseSchema,
} from "../schemas/gameApi";
import { decodeBase64, decodeROT13 } from "../helpers/crypto";
import { FetchClientBuilder } from "../tools/fetchClient";
import { formatNumberToDecimalPlaces } from "../helpers/format";
import type {
    BuyItemResponse,
    GetItemsResponse,
    GetMessagesResponse,
    InvestigateReputationResponse,
    SolveMessageResponse,
    StartGameResponse,
} from "../types/game";

type FetchClient = ReturnType<FetchClientBuilder["createClient"]>;

export class GameApi {
    private readonly fetchClient: FetchClient;

    constructor(client: FetchClient) {
        this.fetchClient = client;
    }

    async startGame(): Promise<StartGameResponse> {
        const response = await this.fetchClient.post("game/start");
        return response.parseJson(startGameResponseSchema);
    }

    async investigateReputation(gameId: string): Promise<InvestigateReputationResponse> {
        const response = await this.fetchClient.post(`${gameId}/investigate/reputation`);
        const reputation = await response.parseJson(reputationResponseSchema);
        return {
            people: formatNumberToDecimalPlaces(reputation.people, 2),
            state: formatNumberToDecimalPlaces(reputation.state, 2),
            underworld: formatNumberToDecimalPlaces(reputation.underworld, 2),
        };
    }

    async getMessages(gameId: string): Promise<GetMessagesResponse> {
        const response = await this.fetchClient.get(`${gameId}/messages`);
        const messages = await response.parseJson(messagesResponseSchema);

        return messages.map((message): GetMessagesResponse[number] => {
            switch (message.encrypted) {
                case 1:
                    return {
                        ...message,
                        adId: decodeBase64(message.adId),
                        message: decodeBase64(message.message),
                        probability: decodeBase64(message.probability),
                    };
                case 2:
                    return {
                        ...message,
                        adId: decodeROT13(message.adId),
                        message: decodeROT13(message.message),
                        probability: decodeROT13(message.probability),
                    };
                default:
                    return message;
            }
        });
    }

    async solveMessage(gameId: string, adId: string): Promise<SolveMessageResponse> {
        const response = await this.fetchClient.post(`${gameId}/solve/${adId}`);
        return response.parseJson(solveMessageResponseSchema);
    }

    async getItems(gameId: string): Promise<GetItemsResponse> {
        const response = await this.fetchClient.get(`${gameId}/shop`);
        return response.parseJson(itemsResponseSchema);
    }

    async buyItem(gameId: string, itemId: string): Promise<BuyItemResponse> {
        const response = await this.fetchClient.post(`${gameId}/shop/buy/${itemId}`);
        return response.parseJson(buyItemResponseSchema);
    }
}
