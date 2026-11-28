import type { FastifyError } from "fastify";
import { AppError, appCodes } from "./errors.js";
import type { ErrorDetail } from "../types/response.js";

type FastifyValidationErrors = NonNullable<FastifyError["validation"]>;

const decodeJsonPointerSegment = (segment: string): string =>
    segment.replace(/~1/g, "/").replace(/~0/g, "~");

const getValidationPath = (instancePath: string, missingProperty: unknown): string => {
    const path = instancePath
        .split("/")
        .filter(Boolean)
        .map((segment): string => decodeJsonPointerSegment(segment));

    if (typeof missingProperty === "string") {
        path.push(missingProperty);
    }

    return path.join(".");
};

export class ValidationError extends AppError {
    constructor(errors: FastifyValidationErrors) {
        const details = errors.map((error): ErrorDetail => ({
            path: getValidationPath(error.instancePath, error.params.missingProperty),
            message: error.message ?? "Invalid value",
        }));

        super("Request validation failed", 400, appCodes.VALIDATION_ERROR, details);
        this.name = "ValidationError";
    }
}

export const schemaErrorFormatter = (errors: FastifyValidationErrors): ValidationError => {
    return new ValidationError(errors);
};
