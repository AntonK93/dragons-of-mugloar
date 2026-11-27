export interface AutoPlayActionLog {
    type: "quest" | "initial" | "purchase" | "reputation" | "gameOver";
    result: string;
    score: number;
    turn: number;
    stateReputation: number;
    peopleReputation: number;
    underworldReputation: number;
    gold: number;
    lives: number;
    timestamp: string;
}
