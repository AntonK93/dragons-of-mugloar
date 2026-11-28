import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../dist/errors/errors.js";
import { GameApiError } from "../../dist/errors/gameApiError.js";

test("GameApiError maps the game-over status to a client error code", () => {
    const error = new GameApiError("Game is over", 410);

    assert.ok(error instanceof AppError);
    assert.ok(error instanceof GameApiError);
    assert.equal(error.apiStatus, 410);
    assert.equal(error.statusCode, 410);
    assert.equal(error.message, "Game Api Error");
    assert.equal(error.code, "GAME_OVER");
});

test("GameApiError hides other API errors while retaining the original status", () => {
    for (const apiStatus of [400, 404, 500]) {
        const error = new GameApiError("API details", apiStatus);

        assert.equal(error.apiStatus, apiStatus);
        assert.equal(error.statusCode, 500);
        assert.equal(error.message, "Internal server error");
        assert.equal(error.code, undefined);
    }
});
