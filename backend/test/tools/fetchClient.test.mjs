import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { GameApiError } from "../../dist/errors/gameApiError.js";
import { FetchClientBuilder } from "../../dist/tools/fetchClient.js";
import { logger } from "../../dist/tools/logger.js";

test("FetchClientBuilder creates a client that resolves URLs and validates JSON", async (t) => {
    const fetch = t.mock.method(
        globalThis,
        "fetch",
        async () => new globalThis.Response(JSON.stringify({ value: 42 })),
    );
    const timeout = t.mock.method(
        globalThis.AbortSignal,
        "timeout",
        () => new globalThis.AbortController().signal,
    );
    const builder = new FetchClientBuilder()
        .setBaseUrl("https://example.test/api/")
        .setTimeout(1000);
    const client = builder.createClient();
    builder.setBaseUrl("https://other.test/").setTimeout(2000);

    const schema = z.object({ value: z.number() });
    assert.deepEqual(await (await client.get("items")).parseJson(schema), {
        value: 42,
    });
    assert.deepEqual(await (await client.post("game/start")).parseJson(schema), {
        value: 42,
    });

    assert.deepEqual(
        fetch.mock.calls.map(({ arguments: [url, options] }) => [String(url), options.method]),
        [
            ["https://example.test/api/items", "GET"],
            ["https://example.test/api/game/start", "POST"],
        ],
    );
    assert.deepEqual(
        timeout.mock.calls.map((call) => call.arguments),
        [[1000], [1000]],
    );
    assert.ok(fetch.mock.calls[0].arguments[1].signal instanceof globalThis.AbortSignal);
});

test("FetchClientBuilder reports invalid JSON and schema violations", async (t) => {
    const fetch = t.mock.method(
        globalThis,
        "fetch",
        async () => new globalThis.Response("not JSON"),
    );
    const client = new FetchClientBuilder().setBaseUrl("https://example.test/api/").createClient();
    const schema = z.object({ value: z.number() });

    await assert.rejects((await client.get("items")).parseJson(schema), {
        name: "InternalServerError",
        message: "Invalid response JSON format: GET /api/items",
    });

    fetch.mock.mockImplementation(
        async () => new globalThis.Response(JSON.stringify({ value: "invalid" })),
    );
    await assert.rejects((await client.post("items")).parseJson(schema), (error) => {
        assert.equal(error.name, "InternalServerError");
        assert.ok(error.message.includes("Invalid response format: POST /api/items"));
        assert.ok(error.message.includes('"path":"value"'));
        return true;
    });
});

test("FetchClientBuilder uses the configured error type and truncates logs", async (t) => {
    const body = "x".repeat(1100);
    t.mock.method(globalThis, "fetch", async () => new globalThis.Response(body, { status: 410 }));
    const logError = t.mock.method(logger, "error", () => {});
    const client = new FetchClientBuilder()
        .setBaseUrl("https://user:password@example.test/api/")
        .setErrorConstructor(GameApiError)
        .createClient();

    await assert.rejects(client.get("game?token=secret"), {
        name: "GameApiError",
        apiStatus: 410,
        statusCode: 410,
        message: "x".repeat(1000),
    });
    const [message] = logError.mock.calls[0].arguments;
    assert.ok(message.includes("HTTP GET https://example.test/api/game failed with status 410"));
    assert.ok(message.includes("x".repeat(1000)));
    assert.ok(!message.includes("x".repeat(1001)));
    assert.ok(!message.includes("password"));
    assert.ok(!message.includes("secret"));
});

test("FetchClientBuilder reports an unreadable error response", async (t) => {
    const response = new globalThis.Response("body", { status: 500 });
    t.mock.method(response, "text", async () => {
        throw new Error("Read failed");
    });
    t.mock.method(globalThis, "fetch", async () => response);
    const logError = t.mock.method(logger, "error", () => {});
    const client = new FetchClientBuilder().setBaseUrl("https://example.test/").createClient();

    await assert.rejects(client.post("items"), {
        name: "InternalServerError",
        message: "Unable to read response body: Read failed",
    });
    assert.match(logError.mock.calls[0].arguments[0], /Unable to read response body: Read failed/);
});

test("FetchClientBuilder propagates network errors and timeouts", async (t) => {
    const networkError = new Error("Network unavailable");
    const fetch = t.mock.method(globalThis, "fetch", async () => {
        throw networkError;
    });
    const client = new FetchClientBuilder()
        .setBaseUrl("https://example.test/")
        .setTimeout(10)
        .createClient();

    await assert.rejects(client.get("items"), (error) => error === networkError);
    fetch.mock.mockImplementation(
        async (_url, { signal }) =>
            new Promise((_, reject) => {
                signal.addEventListener("abort", () => reject(signal.reason), {
                    once: true,
                });
            }),
    );
    const keepAlive = globalThis.setTimeout(() => {}, 1000);
    try {
        await assert.rejects(client.get("items"), { name: "TimeoutError" });
    } finally {
        globalThis.clearTimeout(keepAlive);
    }
});
