import { ErrorDetail } from "../types/response";
import { AppError, appCodes } from "./errors";

export const GAME_OVER_STATUS = 410;
const gameApiCodeMapping = new Map<number, string>([[GAME_OVER_STATUS, appCodes.GAME_OVER]]);

export class GameApiError extends AppError {
    constructor(
        _message: string,
        readonly apiStatus: number,
        readonly details?: ErrorDetail[],
    ) {
        const validCode = gameApiCodeMapping.get(apiStatus);
        super(
            validCode ? "Game Api Error" : "Internal server error",
            validCode ? apiStatus : 500,
            validCode ? validCode : undefined,
        );
    }
}
