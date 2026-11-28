import { InternalServerError } from "../errors/errors.js";
import type { z } from "zod";
import type { ErrorDetail } from "../types/response.js";
import { logger } from "./logger.js";
import PQueue from "p-queue";

type FetchResponse = Response & {
    parseJson<T>(schema: z.ZodType<T>): Promise<T>;
};

type HttpErrorConstructor = new (message: string, status: number) => Error;

class FetchClient {
    base: URL;
    timeout: number;
    errorConstructor: HttpErrorConstructor;
    private readonly requestQueue: PQueue;

    constructor(
        timeout: number,
        baseUrl: string | URL,
        errorConstructor: HttpErrorConstructor,
        maxConcurrentRequests: number,
    ) {
        this.timeout = timeout;
        this.base = new URL(baseUrl);
        this.errorConstructor = errorConstructor;
        this.requestQueue = new PQueue({
            concurrency: maxConcurrentRequests,
        });
    }

    private async parseResponse<T>(
        response: Response,
        operation: string,
        schema: z.ZodType<T>,
    ): Promise<T> {
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
    }

    private async request(url: string | URL, method: "GET" | "POST"): Promise<FetchResponse> {
        const resolvedUrl = new URL(url, this.base);
        const response = await this.requestQueue.add((): Promise<Response> =>
            fetch(resolvedUrl, {
                method,
                signal: AbortSignal.timeout(this.timeout),
            }),
        );

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
            throw new this.errorConstructor(`${responseBody}`, response.status);
        }

        return Object.assign(response, {
            parseJson: <T>(schema: z.ZodType<T>): Promise<T> =>
                this.parseResponse(response, `${method} ${resolvedUrl.pathname}`, schema),
        });
    }

    get(url: string | URL): Promise<FetchResponse> {
        return this.request(url, "GET");
    }
    post(url: string | URL): Promise<FetchResponse> {
        return this.request(url, "POST");
    }
}

export class FetchClientBuilder {
    private base?: URL;
    private timeout = 5_000;
    private maxConcurrentRequests = 5;
    private errorConstructor: HttpErrorConstructor = InternalServerError;

    setTimeout(milliseconds: number): this {
        this.timeout = milliseconds;
        return this;
    }

    setBaseUrl(baseUrl: string | URL): this {
        this.base = new URL(baseUrl);
        return this;
    }

    setMaxConcurrentRequests(limit: number): this {
        if (!Number.isSafeInteger(limit) || limit <= 0) {
            throw new RangeError("Maximum concurrent requests must be a positive safe integer");
        }
        this.maxConcurrentRequests = limit;
        return this;
    }

    setErrorConstructor(errorConstructor: HttpErrorConstructor): this {
        this.errorConstructor = errorConstructor;
        return this;
    }

    createClient(): FetchClient {
        return new FetchClient(
            this.timeout,
            this.base!.toString(),
            this.errorConstructor,
            this.maxConcurrentRequests,
        );
    }
}
