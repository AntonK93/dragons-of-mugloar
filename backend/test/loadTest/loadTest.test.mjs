import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTest, parseGameCount } from "../../dist/loadTest/loadTest.js";
import { GameApi } from "../../dist/services/gameApi.js";
import { AutoPlayService } from "../../dist/services/autoPlay.js";
import { GameStatistics } from "../../dist/services/gameStatistics.js";
import { GameApiError } from "../../dist/errors/gameApiError.js";
import { logger } from "../../dist/tools/logger.js";

test("parseGameCount validates the game count", () => {
    assert.equal(parseGameCount(["--gameCount", "15"]), 15);
    for (const args of [
        [],
        ["--gameCount", "0"],
        ["--gameCount", "1.5"],
        ["--gameCount", "9007199254740992"],
        ["--gameCount", "1", "--turnCount", "2"],
    ]) {
        assert.throws(() => parseGameCount(args));
    }
});

test("loadTest starts games, runs cycles and records statistics", async (t) => {
    let id = 0;
    const startGame = t.mock.method(GameApi.prototype, "startGame", async () => {
        const gameId = `game-${++id}`;
        return { gameId, turn: 0, gold: 0, score: 0, lives: 3 };
    });
    const turns = new Map();
    const playTurn = t.mock.method(AutoPlayService.prototype, "playTurn", async (gameId) => {
        const count = (turns.get(gameId) ?? 0) + 1;
        turns.set(gameId, count);
        if (count === 3) {
            throw new GameApiError("Game over", 410);
        }
    });
    const record = t.mock.method(GameStatistics.prototype, "recordCompletedGame", () => {});
    const info = t.mock.method(logger, "info", () => {});
    t.mock.method(logger, "error", () => {});

    await loadTest(15);

    assert.equal(startGame.mock.callCount(), 15);
    assert.equal(playTurn.mock.callCount(), 45);
    const logs = info.mock.calls.map(({ arguments: args }) => args[0]);
    assert.ok(
        logs.some(
            (message) => typeof message === "string" && message.startsWith("Starting cycle 1 "),
        ),
    );
    assert.ok(
        logs.some(
            (message) => typeof message === "string" && message.startsWith("Starting cycle 3 "),
        ),
    );
    assert.ok(logs.includes("Completed 3 cycles for 15 games"));
    assert.equal(record.mock.callCount(), 15);
    assert.ok(logs.includes("Statistics available in game-statistic.json file"));
    for (const {
        arguments: [gameId, log],
    } of playTurn.mock.calls) {
        assert.match(gameId, /^game-\d+$/);
        assert.equal(log[0].type, "initial");
    }
});

test("loadTest waits for all start attempts and stops if any fail", async (t) => {
    const error = new Error("Request failed");
    let completeLast;
    const lastGame = new Promise((resolve) => {
        completeLast = resolve;
    });

    let calls = 0;
    const startGame = t.mock.method(GameApi.prototype, "startGame", async () => {
        calls++;
        if (calls === 1) {
            throw error;
        }
        if (calls === 2) {
            return { gameId: "game-2", turn: 0, gold: 0, score: 0, lives: 3 };
        }
        return lastGame;
    });
    const playTurn = t.mock.method(AutoPlayService.prototype, "playTurn", async () => {});
    const logError = t.mock.method(logger, "error", () => {});
    t.mock.method(logger, "info", () => {});

    const task = loadTest(3);
    try {
        await new Promise((resolve) => globalThis.setImmediate(resolve));
        assert.equal(startGame.mock.callCount(), 3);
        assert.equal(logError.mock.callCount(), 0);
    } finally {
        completeLast({ gameId: "game-3", turn: 0, gold: 0, score: 0, lives: 3 });
        await task;
    }
    assert.equal(playTurn.mock.callCount(), 0);
    assert.equal(logError.mock.callCount(), 1);
    assert.deepEqual(logError.mock.calls[0].arguments, [
        { err: error },
        "Failed to start game 1 stopping script",
    ]);
});

test("loadTest skips finished games while other games remain active", async (t) => {
    let id = 0;
    t.mock.method(GameApi.prototype, "startGame", async () => ({
        gameId: `game-${++id}`,
        turn: 0,
        gold: 0,
        score: 0,
        lives: 3,
    }));
    let secondGameTurns = 0;
    const playTurn = t.mock.method(AutoPlayService.prototype, "playTurn", async (gameId) => {
        if (gameId === "game-1" || ++secondGameTurns === 2) {
            throw new GameApiError("Game over", 410);
        }
    });
    const record = t.mock.method(GameStatistics.prototype, "recordCompletedGame", () => {});
    const info = t.mock.method(logger, "info", () => {});
    t.mock.method(logger, "error", () => {});

    await loadTest(2);

    assert.deepEqual(
        playTurn.mock.calls.map(({ arguments: [gameId] }) => gameId),
        ["game-1", "game-2", "game-2"],
    );
    assert.deepEqual(
        record.mock.calls.map(({ arguments: [gameId] }) => gameId),
        ["game-1", "game-2"],
    );
    assert.ok(
        info.mock.calls.some(
            ({ arguments: [message] }) => message === "Completed 2 cycles for 2 games",
        ),
    );
});
