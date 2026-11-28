import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanupTask } from "../../dist/tasks/cleanupTask.js";

test("cleanupTask removes expired completed games and keeps active and recent games", async (t) => {
    t.mock.method(Date, "now", () => Date.parse("2026-01-02T12:00:00.000Z"));
    const games = {
        getAll: () => [
            ["expired", { status: "gameOver", lastUpdate: Date.parse("2026-01-01T11:59:59.999Z") }],
            [
                "boundary",
                { status: "gameOver", lastUpdate: Date.parse("2026-01-01T12:00:00.000Z") },
            ],
            ["recent", { status: "gameOver", lastUpdate: Date.parse("2026-01-01T12:00:00.001Z") }],
            ["active", { status: "active", lastUpdate: Date.parse("2025-01-01T00:00:00.000Z") }],
        ],
        delete: t.mock.fn(),
    };

    await cleanupTask(games);

    assert.deepEqual(
        games.delete.mock.calls.map((call) => call.arguments[0]),
        ["expired", "boundary"],
    );
});
