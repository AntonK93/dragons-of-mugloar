export interface GameParams {
    gameId: string;
}

export interface SolveMessageParams extends GameParams {
    adId: string;
}

export interface BuyItemParams extends GameParams {
    itemId: string;
}
