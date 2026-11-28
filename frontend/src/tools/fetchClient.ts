class ApiError extends Error {
    readonly code?: string;

    constructor(status: number, code?: string) {
        super(`HTTP request failed with status ${status}`);
        this.code = code;
    }
}

export class FetchClientBuilder {
    private base?: URL;
    private timeout = 5_000;

    setTimeout(milliseconds: number): this {
        this.timeout = milliseconds;
        return this;
    }

    setBaseUrl(baseUrl: string | URL): this {
        this.base = new URL(baseUrl);
        return this;
    }

    createClient() {
        const base = this.base;
        const timeout = this.timeout;

        const request = async (url: string | URL, method: "GET" | "POST"): Promise<Response> => {
            const response = await fetch(new URL(url, base), {
                method,
                signal: AbortSignal.timeout(timeout),
            });

            if (!response.ok) {
                let body: unknown;
                try {
                    body = await response.json();
                } catch (error) {
                    if (!(error instanceof SyntaxError)) {
                        throw error;
                    }
                }
                const code =
                    typeof body === "object" &&
                    body !== null &&
                    "code" in body &&
                    typeof body.code === "string"
                        ? body.code
                        : undefined;
                throw new ApiError(response.status, code);
            }

            return response;
        };

        return {
            get: (url: string | URL) => request(url, "GET"),
            post: (url: string | URL) => request(url, "POST"),
        };
    }
}
