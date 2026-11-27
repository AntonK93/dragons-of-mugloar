import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../dist/errors/errors.js";
import { GameApiError } from "../../dist/errors/gameApiError.js";

test("GameApiError preserves the game-over status and message", () => {
    const error = new GameApiError("Game is over", 410);

    assert.ok(error instanceof AppError);
    assert.equal(error.name, "GameApiError");
    assert.equal(error.apiStatus, 410);
    assert.equal(error.statusCode, 410);
    assert.equal(error.message, "Game is over");
});

test("GameApiError hides other API errors while retaining the original status", () => {
    for (const apiStatus of [400, 404, 500]) {
        const error = new GameApiError("API details", apiStatus);

        assert.equal(error.apiStatus, apiStatus);
        assert.equal(error.statusCode, 500);
        assert.equal(error.message, "Internal server error");
    }
});
