import assert from "node:assert/strict";
import { test } from "node:test";
import { errorCodes } from "fastify";
import { errorHandler } from "../../dist/errors/errorHandler.js";
import { AppError, InternalServerError } from "../../dist/errors/errors.js";
import { logger } from "../../dist/tools/logger.js";

/** @param {import("node:test").TestContext} t */
const createContext = (t) => {
    const request = {};
    const reply = { code: t.mock.fn(), send: t.mock.fn() };
    const logError = t.mock.method(logger, "error", () => {});
    reply.code.mock.mockImplementation(() => reply);
    return { request, reply, logError };
};

test("errorHandler returns application client errors with their details", (t) => {
    const { request, reply, logError } = createContext(t);
    const details = [{ path: "gameId", message: "Invalid game ID" }];
    const error = new AppError("Invalid request", 400, details);

    errorHandler(error, request, reply);

    assert.deepEqual(reply.code.mock.calls[0].arguments, [400]);
    assert.deepEqual(reply.send.mock.calls[0].arguments, [{ message: "Invalid request", details }]);
    assert.equal(logError.mock.callCount(), 0);
});

test("errorHandler returns allowed Fastify client errors", (t) => {
    const { request, reply, logError } = createContext(t);
    const error = new errorCodes.FST_ERR_CTP_INVALID_MEDIA_TYPE("application/example");

    errorHandler(error, request, reply);

    assert.deepEqual(reply.code.mock.calls[0].arguments, [415]);
    assert.deepEqual(reply.send.mock.calls[0].arguments, [{ message: error.message }]);
    assert.equal(logError.mock.callCount(), 0);
});

test("errorHandler logs server errors and returns a generic response", (t) => {
    const { request, reply, logError } = createContext(t);
    const error = new InternalServerError("Sensitive server details");

    errorHandler(error, request, reply);

    assert.deepEqual(logError.mock.calls[0].arguments, [{ err: error }, "Unexpected error"]);
    assert.deepEqual(reply.code.mock.calls[0].arguments, [500]);
    assert.deepEqual(reply.send.mock.calls[0].arguments, [{ message: "Internal server error" }]);
});

test("errorHandler does not expose unrecognized errors even with a client status", (t) => {
    const { request, reply, logError } = createContext(t);
    const error = Object.assign(new Error("Sensitive details"), {
        statusCode: 400,
    });

    errorHandler(error, request, reply);

    assert.deepEqual(logError.mock.calls[0].arguments, [{ err: error }, "Unexpected error"]);
    assert.deepEqual(reply.code.mock.calls[0].arguments, [500]);
    assert.deepEqual(reply.send.mock.calls[0].arguments, [{ message: "Internal server error" }]);
});
