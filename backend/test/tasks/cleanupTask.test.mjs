import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanupTask } from "../../dist/tasks/cleanupTask.js";
import { logger } from "../../dist/tools/logger.js";

test("cleanupTask removes empty and expired games, keeps active and recent games", async (t) => {
    t.mock.method(Date, "now", () => Date.parse("2026-01-02T12:00:00.000Z"));
    const games = {
        getAll: () => [
            ["empty", []],
            ["expired", [{ type: "quest", lives: 0, timestamp: "2026-01-01T11:59:59.999Z" }]],
            ["boundary", [{ type: "gameOver", lives: 1, timestamp: "2026-01-01T12:00:00.000Z" }]],
            ["recent", [{ type: "gameOver", lives: 0, timestamp: "2026-01-01T12:00:00.001Z" }]],
            ["active", [{ type: "quest", lives: 1, timestamp: "2025-01-01T00:00:00.000Z" }]],
            [
                "last-action",
                [
                    { type: "quest", lives: 0, timestamp: "2025-01-01T00:00:00.000Z" },
                    { type: "gameOver", lives: 0, timestamp: "2026-01-02T11:00:00.000Z" },
                ],
            ],
        ],
        delete: t.mock.fn(),
    };

    await cleanupTask(games);

    assert.deepEqual(
        games.delete.mock.calls.map((call) => call.arguments[0]),
        ["empty", "expired", "boundary"],
    );
});

test("cleanupTask logs an invalid completion timestamp and continues", async (t) => {
    t.mock.method(Date, "now", () => Date.parse("2026-01-02T12:00:00.000Z"));
    const logError = t.mock.method(logger, "error", () => {});
    const games = {
        getAll: () => [
            ["invalid", [{ type: "gameOver", lives: 0, timestamp: "invalid" }]],
            ["expired", [{ type: "gameOver", lives: 0, timestamp: "2026-01-01T00:00:00.000Z" }]],
        ],
        delete: t.mock.fn(),
    };

    await cleanupTask(games);

    assert.deepEqual(
        logError.mock.calls.map((call) => call.arguments),
        [["Invalid completion timestamp for game invalid"]],
    );
    assert.deepEqual(
        games.delete.mock.calls.map((call) => call.arguments),
        [["expired"]],
    );
});
