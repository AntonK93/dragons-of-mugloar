import type { AutoPlayGamesStore } from "../cache/autoPlayGames.js";
import { autoPlayConfig } from "../config.js";
import type { GameApi } from "./gameApi.js";
import { AutoPlayActionLog } from "../types/autoplay.js";
import { InternalServerError } from "../errors/errors.js";
import {
    GetMessagesResponse,
    InvestigateReputationResponse,
    StartGameResponse,
} from "../types/game.js";

export const startAutoPlayGame = async (
    gameApi: GameApi,
    autoPlayGamesStore: AutoPlayGamesStore,
): Promise<StartGameResponse> => {
    const gameData = await gameApi.startGame();
    autoPlayGamesStore.add(gameData.gameId, {
        type: "initial",
        result: "Game started",
        turn: gameData.turn,
        gold: gameData.gold,
        stateReputation: 0,
        peopleReputation: 0,
        underworldReputation: 0,
        score: gameData.score,
        lives: gameData.lives,
        timestamp: Date.now(),
    });
    return gameData;
};

export class AutoPlayService {
    private readonly gameApi: GameApi;
    private readonly autoPlayGamesStore: AutoPlayGamesStore;
    private readonly questComplexityOrder = new Map<string, number>([
        ["Piece of cake", 1],
        ["Sure thing", 2],
        ["Walk in the park", 3],
        ["Quite likely", 4],
        ["Hmmm....", 5],
        ["Rather detrimental", 6],
        ["Gamble", 7],
        ["Risky", 8],
        ["Playing with fire", 9],
        ["Suicide mission", 10],
        ["Impossible", 11],
    ]);
    private readonly stateReputationQuestKeyword = ["Steal", "Infiltrate"];

    constructor(gameApi: GameApi, autoPlayGamesStore: AutoPlayGamesStore) {
        this.gameApi = gameApi;
        this.autoPlayGamesStore = autoPlayGamesStore;
    }

    async playTurn(gameId: string, gameLog: AutoPlayActionLog[]): Promise<void> {
        const lastLog = gameLog[gameLog.length - 1];
        if (await this.buyItemIfPossible(gameId, lastLog)) {
            return;
        }
        await this.solveQuest(gameId, lastLog);
    }

    private isQuestReputationRisky(message: string): boolean {
        return this.stateReputationQuestKeyword.some((sign): boolean => message.includes(sign));
    }

    private sortQuests(quests: GetMessagesResponse, stateReputation?: number): GetMessagesResponse {
        const isReputationRiskQuest = (message: string): boolean =>
            stateReputation !== undefined &&
            stateReputation < 0 &&
            this.isQuestReputationRisky(message);
        return quests.sort((a, b): number => {
            const reputationOrder =
                Number(isReputationRiskQuest(a.message)) - Number(isReputationRiskQuest(b.message));
            const probabilityOrder =
                (this.questComplexityOrder.get(a.probability) ?? Infinity) -
                (this.questComplexityOrder.get(b.probability) ?? Infinity);
            const expirationOrder = a.expiresIn - b.expiresIn;
            return reputationOrder || probabilityOrder || expirationOrder;
        });
    }

    private async getQuests(gameId: string): Promise<GetMessagesResponse> {
        const quests = await this.gameApi.getMessages(gameId);
        if (!quests?.length) {
            throw new InternalServerError("No quests available");
        }
        return quests;
    }

    private async solveQuest(gameId: string, lastAction: AutoPlayActionLog): Promise<void> {
        const quests = await this.getQuests(gameId);
        let questToSolve = this.sortQuests(quests)[0];
        let reputation: InvestigateReputationResponse = {
            state: lastAction.stateReputation,
            people: lastAction.peopleReputation,
            underworld: lastAction.underworldReputation,
        };
        if (this.isQuestReputationRisky(questToSolve.message)) {
            reputation = await this.gameApi.investigateReputation(gameId);
            this.autoPlayGamesStore.addActionLog(gameId, {
                type: "reputation",
                result: "Investigated reputation",
                turn: lastAction.turn + 1,
                gold: lastAction.gold,
                stateReputation: reputation.state,
                peopleReputation: reputation.people,
                underworldReputation: reputation.underworld,
                score: lastAction.score,
                lives: lastAction.lives,
                timestamp: Date.now(),
            });
            const quests = await this.getQuests(gameId);
            const reshuffledQuests = this.sortQuests(quests, reputation.state);
            questToSolve = reshuffledQuests[0];
        }

        const solveResult = await this.gameApi.solveMessage(gameId, questToSolve.adId);
        this.autoPlayGamesStore.addActionLog(gameId, {
            type: "quest",
            result: [
                `Quest result: ${solveResult.message}`,
                `Probability: ${questToSolve.probability}`,
                `Quest message: ${questToSolve.message}`,
            ].join(" - "),
            turn: solveResult.turn,
            gold: solveResult.gold,
            stateReputation: reputation.state,
            peopleReputation: reputation.people,
            underworldReputation: reputation.underworld,
            score: solveResult.score,
            lives: solveResult.lives,
            timestamp: Date.now(),
        });
    }

    private async buyItemIfPossible(
        gameId: string,
        lastAction: AutoPlayActionLog,
    ): Promise<boolean> {
        let itemId: string;
        if (
            lastAction.lives <= autoPlayConfig.livesThreshold &&
            lastAction.gold >= autoPlayConfig.hpPotCost
        ) {
            itemId = autoPlayConfig.hpPotId;
        } else {
            const items = await this.gameApi.getItems(gameId);
            if (!items?.length) {
                throw new InternalServerError("No items available");
            }
            const item = items
                .filter(
                    (item): boolean =>
                        item.id !== autoPlayConfig.hpPotId &&
                        item.cost <= lastAction.gold - autoPlayConfig.hpPotCost,
                )
                .sort((a, b): number => b.cost - a.cost)[0];
            if (!item) {
                return false;
            }
            itemId = item.id;
        }

        const result = await this.gameApi.buyItem(gameId, itemId);
        if (!result.shoppingSuccess) {
            throw new InternalServerError(`Failed to buy item ${itemId} for game ${gameId}`);
        }
        this.autoPlayGamesStore.addActionLog(gameId, {
            type: "purchase",
            result: "You bought item: " + itemId,
            turn: result.turn,
            gold: result.gold,
            stateReputation: lastAction.stateReputation,
            peopleReputation: lastAction.peopleReputation,
            underworldReputation: lastAction.underworldReputation,
            score: lastAction.score,
            lives: result.lives,
            timestamp: Date.now(),
        });
        return true;
    }
}

export const createAutoPlayService = (
    gameApi: GameApi,
    autoPlayGamesStore: AutoPlayGamesStore,
): AutoPlayService => {
    return new AutoPlayService(gameApi, autoPlayGamesStore);
};
