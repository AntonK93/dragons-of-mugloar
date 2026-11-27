import { InternalServerError } from "../errors/errors";
import type { z } from "zod";
import type { ErrorDetail } from "../types/response";
import { logger } from "./logger";

type FetchResponse = Response & {
    parseJson<T>(schema: z.ZodType<T>): Promise<T>;
};

interface FetchClient {
    get(url: string | URL): Promise<FetchResponse>;
    post(url: string | URL): Promise<FetchResponse>;
}

type HttpErrorConstructor = new (message: string, status: number) => Error;

const parseResponse = async <T>(
    response: Response,
    operation: string,
    schema: z.ZodType<T>,
): Promise<T> => {
    let data: unknown;
    try {
        data = await response.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new InternalServerError(`Invalid response JSON format: ${operation}`);
        }
        throw error;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
        const issues = result.error.issues.map((issue): ErrorDetail => ({
            path: issue.path.join("."),
            message: issue.message,
        }));
        throw new InternalServerError(
            `Invalid response format: ${operation}; ${JSON.stringify(issues)}`,
        );
    }
    return result.data;
};

export class FetchClientBuilder {
    private base?: URL;
    private timeout = 5_000;
    private errorConstructor: HttpErrorConstructor = InternalServerError;

    setTimeout(milliseconds: number): this {
        this.timeout = milliseconds;
        return this;
    }

    setBaseUrl(baseUrl: string | URL): this {
        this.base = new URL(baseUrl);
        return this;
    }

    setErrorConstructor(errorConstructor: HttpErrorConstructor): this {
        this.errorConstructor = errorConstructor;
        return this;
    }

    createClient(): FetchClient {
        const base = this.base;
        const timeout = this.timeout;
        const errorConstructor = this.errorConstructor;

        const request = async (
            url: string | URL,
            method: "GET" | "POST",
        ): Promise<FetchResponse> => {
            const resolvedUrl = new URL(url, base);
            const response = await fetch(resolvedUrl, {
                method,
                signal: AbortSignal.timeout(timeout),
            });

            if (!response.ok) {
                let responseBody: string;
                try {
                    responseBody = (await response.text()).slice(0, 1_000);
                } catch (error) {
                    const reason = error instanceof Error ? error.message : String(error);
                    responseBody = `Unable to read response body: ${reason}`;
                }
                logger.error(
                    `HTTP ${method} ${resolvedUrl.origin}${resolvedUrl.pathname} ` +
                        `failed with status ${response.status} ${response.statusText}; ` +
                        `response: ${JSON.stringify(responseBody)}`,
                );
                throw new errorConstructor(`${responseBody}`, response.status);
            }

            return Object.assign(response, {
                parseJson: <T>(schema: z.ZodType<T>): Promise<T> =>
                    parseResponse(response, `${method} ${resolvedUrl.pathname}`, schema),
            });
        };

        return {
            get: (url: string | URL): Promise<FetchResponse> => request(url, "GET"),
            post: (url: string | URL): Promise<FetchResponse> => request(url, "POST"),
        };
    }
}
