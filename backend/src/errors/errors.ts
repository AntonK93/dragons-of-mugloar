import { ErrorDetail } from "../types/response";

export const appCodes = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    GAME_OVER: "GAME_OVER",
} as const;

export class AppError extends Error {
    constructor(
        message: string,
        readonly statusCode: number,
        readonly code?: string,
        readonly details?: ErrorDetail[],
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Route not found") {
        super(message, 404);
        this.name = "NotFoundError";
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal server error") {
        super(message, 500);
        this.name = "InternalServerError";
    }
}
