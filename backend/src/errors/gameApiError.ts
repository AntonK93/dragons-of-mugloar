import { AppError } from "./errors";

export const GAME_OVER_STATUS = 410;
const validEndUserErrors = [GAME_OVER_STATUS];

export class GameApiError extends AppError {
    constructor(
        message: string,
        readonly apiStatus: number,
    ) {
        const isValid = validEndUserErrors.includes(apiStatus);
        super(isValid ? message : "Internal server error", isValid ? apiStatus : 500);
        this.name = "GameApiError";
    }
}
