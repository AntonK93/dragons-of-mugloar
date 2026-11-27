import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { config } from "../config";
import { FetchClientBuilder } from "../tools/fetchClient";
import type { RootState } from "./store";
import { toast } from "react-toastify";

interface GameData {
    gameId: string;
    lives: number;
    gold: number;
    level: number;
    score: number;
    highScore: number;
    turn: number;
}

interface ReputationData {
    people: number;
    state: number;
    underworld: number;
}

interface GameMessage {
    adId: string;
    message: string;
    reward: number;
    expiresIn: number;
    encrypted: number | null;
    probability: string;
}

interface SolveMessageResponse {
    success: boolean;
    lives: number;
    gold: number;
    score: number;
    highScore: number;
    turn: number;
    message: string;
}

interface ShopItem {
    id: string;
    name: string;
    cost: number;
}

interface BuyItemResponse {
    shoppingSuccess: boolean;
    gold: number;
    lives: number;
    level: number;
    turn: number;
}

interface AutoPlayActionLog {
    type: string;
    result: string;
    turn: number;
    score?: number;
    gold: number;
    lives: number;
    stateReputation: number;
    peopleReputation: number;
    underworldReputation: number;
    timestamp: string;
}

interface GameState {
    gameData: GameData | null;
    autoPlay: boolean;
    reputationData: ReputationData | null;
    messages: GameMessage[] | null;
    items: ShopItem[] | null;
    shopItems: ShopItem[] | null;
    autoPlayActionLog: AutoPlayActionLog[] | null;
}

const initialState: GameState = {
    gameData: null,
    autoPlay: false,
    reputationData: null,
    items: null,
    messages: null,
    shopItems: null,
    autoPlayActionLog: null,
};

const fetchClient = new FetchClientBuilder().setBaseUrl(config.apiBaseUrl).createClient();

export const startGame = createAsyncThunk<void, void, { state: RootState }>(
    "game/start",
    async (_, { dispatch }) => {
        const response = await fetchClient.post("game/start");
        const data: GameData = await response.json();
        if (!data.gameId) {
            throw new Error("Invalid start game response");
        }
        dispatch(setGameData(data));
    },
);

export const investigateReputation = createAsyncThunk<void, void, { state: RootState }>(
    "game/investigateReputation",
    async (_, { dispatch, getState }) => {
        const gameId = getState().game.gameData?.gameId;
        if (!gameId) {
            throw new Error("Cannot investigate reputation without a game");
        }
        const response = await fetchClient.post(
            `game/${encodeURIComponent(gameId)}/investigate/reputation`,
        );
        const data: ReputationData = await response.json();
        dispatch(setReputationData(data));
    },
);

export const getMessages = createAsyncThunk<void, void, { state: RootState }>(
    "game/getMessages",
    async (_, { dispatch, getState }) => {
        const gameId = getState().game.gameData?.gameId;
        if (!gameId) {
            throw new Error("Cannot get messages without a game");
        }
        const response = await fetchClient.get(`game/${encodeURIComponent(gameId)}/messages`);
        const data: GameMessage[] = await response.json();
        dispatch(setMessages(data));
    },
);

export const getAutoPlayLog = createAsyncThunk<void, void, { state: RootState }>(
    "game/getAutoPlayLog",
    async (_, { dispatch, getState }) => {
        const gameId = getState().game.gameData?.gameId;
        if (!gameId) {
            throw new Error("Cannot get auto-play log without a game");
        }
        const response = await fetchClient.get(`game/${encodeURIComponent(gameId)}/auto-play`);
        const data: AutoPlayActionLog[] = await response.json();
        dispatch(setActionLog(data));
    },
);

export const startAutoPlay = createAsyncThunk<void, void, { state: RootState }>(
    "game/startAutoPlay",
    async (_, { dispatch }) => {
        const response = await fetchClient.post("game/auto-play");
        const data: GameData = await response.json();
        dispatch(resetGame());
        dispatch(setGameData(data));
        dispatch(setAutoPlay(true));
    },
);

export const solveMessage = createAsyncThunk<void, string, { state: RootState }>(
    "game/solveMessage",
    async (adId, { dispatch, getState }) => {
        const gameData = getState().game.gameData;
        if (!gameData || !gameData.gameId) {
            throw new Error("Cannot buy an item without a game");
        }
        const gameId = gameData.gameId;
        const response = await fetchClient.post(
            `game/${encodeURIComponent(gameId)}/solve/${encodeURIComponent(adId)}`,
        );
        const data: SolveMessageResponse = await response.json();
        dispatch(
            setGameData({
                ...gameData,
                lives: data.lives,
                gold: data.gold,
                score: data.score,
                highScore: data.highScore,
                turn: data.turn,
            }),
        );
        if (data.success) {
            toast.success(`${data.message}`);
        } else {
            toast.error(`${data.message}`);
        }
    },
);

export const getShopItems = createAsyncThunk<void, void, { state: RootState }>(
    "game/getShopItems",
    async (_, { dispatch, getState }) => {
        const gameId = getState().game.gameData?.gameId;
        if (!gameId) {
            throw new Error("Cannot get shop items without a game");
        }
        const response = await fetchClient.get(`game/${encodeURIComponent(gameId)}/shop`);
        const data: ShopItem[] = await response.json();
        dispatch(setShopItems(data));
    },
);

export const buyItem = createAsyncThunk<void, string, { state: RootState }>(
    "game/buyItem",
    async (itemId, { dispatch, getState }) => {
        const gameData = getState().game.gameData;
        if (!gameData || !gameData.gameId) {
            throw new Error("Cannot buy an item without a game");
        }
        const gameId = gameData.gameId;
        const response = await fetchClient.get(
            `game/${encodeURIComponent(gameId)}/shop/buy/${encodeURIComponent(itemId)}`,
        );
        const data: BuyItemResponse = await response.json();
        dispatch(
            setGameData({
                ...gameData,
                gold: data.gold,
                lives: data.lives,
                level: data.level,
                turn: data.turn,
            }),
        );
        if (!data.shoppingSuccess) {
            toast.error("Could not buy item");
            throw new Error("Could not buy item");
        }
        const item = getState().game.shopItems?.find((i) => i.id === itemId);
        if (item) {
            dispatch(addItem(item));
        }
        toast.success("Item bought successfully");
    },
);

const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        resetGame: () => initialState,
        setAutoPlay: (state, action: PayloadAction<boolean>) => {
            state.autoPlay = action.payload;
        },
        setGameData: (state, action: PayloadAction<GameData>) => {
            state.gameData = action.payload;
        },
        setReputationData: (state, action: PayloadAction<ReputationData>) => {
            state.reputationData = action.payload;
        },
        setMessages: (state, action: PayloadAction<GameMessage[]>) => {
            state.messages = action.payload;
        },
        setShopItems: (state, action: PayloadAction<ShopItem[]>) => {
            state.shopItems = action.payload;
        },
        addItem: (state, action: PayloadAction<ShopItem>) => {
            state.items = [...(state.items || []), action.payload];
        },
        setActionLog: (state, action: PayloadAction<AutoPlayActionLog[]>) => {
            state.autoPlayActionLog = action.payload;
        },
    },
});

export const {
    resetGame,
    setAutoPlay,
    setGameData,
    setReputationData,
    setMessages,
    setShopItems,
    addItem,
    setActionLog,
} = gameSlice.actions;
export default gameSlice.reducer;
