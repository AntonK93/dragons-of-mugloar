import { errorCodes, type FastifyError, type FastifyReply, type FastifyRequest } from "fastify";
import { AppError, InternalServerError, NotFoundError } from "./errors.js";
import { ApiErrorResponse } from "../types/response.js";
import { logger } from "../tools/logger.js";

const allowedFastifyErrorTypes = [
    errorCodes.FST_ERR_CTP_INVALID_JSON_BODY,
    errorCodes.FST_ERR_CTP_EMPTY_JSON_BODY,
    errorCodes.FST_ERR_CTP_INVALID_CONTENT_LENGTH,
    errorCodes.FST_ERR_CTP_BODY_TOO_LARGE,
    errorCodes.FST_ERR_CTP_INVALID_MEDIA_TYPE,
];

export const errorHandler = (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply,
): void => {
    const isAppError = error instanceof AppError;
    const isAllowedFastifyError = allowedFastifyErrorTypes.some(
        (type): boolean => error instanceof type,
    );
    const statusCode = error.statusCode;
    if (
        (isAppError || isAllowedFastifyError) &&
        typeof statusCode === "number" &&
        Number.isInteger(statusCode) &&
        statusCode >= 400 &&
        statusCode < 500
    ) {
        const apiError: ApiErrorResponse = { message: error.message };
        if (isAppError) {
            apiError.code = error.code;
            apiError.details = error.details;
        }
        reply.code(statusCode).send(apiError);
        return;
    }

    logger.error({ err: error }, "Unexpected error");
    const internalError = new InternalServerError();
    reply.code(internalError.statusCode).send({ message: internalError.message });
};

export const notFoundHandler = (): never => {
    throw new NotFoundError();
};
