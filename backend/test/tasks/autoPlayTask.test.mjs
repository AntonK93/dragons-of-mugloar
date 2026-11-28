import assert from "node:assert/strict";
import { test } from "node:test";
import { GameApiError } from "../../dist/errors/gameApiError.js";
import { autoPlayTask } from "../../dist/tasks/autoPlayTask.js";
import { logger } from "../../dist/tools/logger.js";
import { AutoPlayGamesStore } from "../../dist/cache/autoPlayGames.js";

const initialAction = {
    type: "initial",
    result: "Game started",
    score: 100,
    turn: 1,
    gold: 10,
    lives: 3,
    stateReputation: 0,
    peopleReputation: 0,
    underworldReputation: 0,
    timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
};

test("autoPlayTask runs a turn for each game", async (t) => {
    const firstLog = [initialAction];
    const secondLog = [{ ...initialAction, score: 200 }];
    const autoPlay = { playTurn: t.mock.fn(async () => {}) };
    const games = {
        getActiveGames: () => [
            ["game1", { actionLogs: firstLog }],
            ["game2", { actionLogs: secondLog }],
        ],
        addActionLog: t.mock.fn(),
        setStatus: t.mock.fn(),
    };
    const statistics = { recordCompletedGame: t.mock.fn() };

    await autoPlayTask(autoPlay, games, statistics);

    assert.deepEqual(
        autoPlay.playTurn.mock.calls.map((call) => call.arguments),
        [
            ["game1", firstLog],
            ["game2", secondLog],
        ],
    );
    assert.equal(games.addActionLog.mock.callCount(), 0);
    assert.equal(statistics.recordCompletedGame.mock.callCount(), 0);
});

test("autoPlayTask skips completed games", async (t) => {
    t.mock.method(logger, "info", () => {});
    const games = new AutoPlayGamesStore();
    games.add("active", initialAction);
    games.add("completed", initialAction);
    games.addActionLog("completed", { ...initialAction, type: "gameOver" });
    const autoPlay = { playTurn: t.mock.fn(async () => {}) };

    await autoPlayTask(autoPlay, games, { recordCompletedGame: t.mock.fn() });

    assert.deepEqual(
        autoPlay.playTurn.mock.calls.map((call) => call.arguments[0]),
        ["active"],
    );
});

test("autoPlayTask records game over when the API returns 410", async (t) => {
    const error = new GameApiError("Game is over", 410);
    const logError = t.mock.method(logger, "error", () => {});
    const lastAction = { ...initialAction, type: "quest", score: 250, turn: 3 };
    const autoPlay = {
        playTurn: t.mock.fn(async () => {
            throw error;
        }),
    };
    const games = {
        getActiveGames: () => [["game1", { actionLogs: [initialAction, lastAction] }]],
        addActionLog: t.mock.fn(),
        setStatus: t.mock.fn(),
    };
    const statistics = { recordCompletedGame: t.mock.fn() };

    await autoPlayTask(autoPlay, games, statistics);

    assert.deepEqual(logError.mock.calls[0].arguments, [
        error,
        "Failed to play turn for game game1",
    ]);
    assert.deepEqual(statistics.recordCompletedGame.mock.calls[0].arguments, ["game1", 250]);
    assert.deepEqual(games.setStatus.mock.calls[0].arguments, ["game1", "gameOver"]);
    assert.equal(games.addActionLog.mock.callCount(), 0);
});

test("autoPlayTask logs other errors without ending the game", async (t) => {
    const error = new Error("Network unavailable");
    const logError = t.mock.method(logger, "error", () => {});
    const autoPlay = {
        playTurn: t.mock.fn(async () => {
            throw error;
        }),
    };
    const games = {
        getActiveGames: () => [["game1", { actionLogs: [initialAction] }]],
        addActionLog: t.mock.fn(),
        setStatus: t.mock.fn(),
    };
    const statistics = { recordCompletedGame: t.mock.fn() };

    await autoPlayTask(autoPlay, games, statistics);

    assert.deepEqual(logError.mock.calls[0].arguments, [
        error,
        "Failed to play turn for game game1",
    ]);
    assert.equal(games.addActionLog.mock.callCount(), 0);
    assert.equal(games.setStatus.mock.callCount(), 0);
    assert.equal(statistics.recordCompletedGame.mock.callCount(), 0);
});

test("autoPlayTask waits for other games when recording statistics fails", async (t) => {
    let finishSlowGame;
    let finished = false;
    const slowGame = new Promise((resolve) => {
        finishSlowGame = resolve;
    });
    t.mock.method(logger, "error", () => {});
    const autoPlay = {
        playTurn: t.mock.fn(async (gameId) => {
            if (gameId === "slow") {
                await slowGame;
            } else {
                throw new GameApiError("Game is over", 410);
            }
        }),
    };
    const games = {
        getActiveGames: () => [
            ["slow", { actionLogs: [initialAction] }],
            ["ended", { actionLogs: [initialAction] }],
        ],
        setStatus: t.mock.fn(),
    };
    const statistics = {
        recordCompletedGame: t.mock.fn(() => {
            throw new Error("Statistics unavailable");
        }),
    };
    const task = autoPlayTask(autoPlay, games, statistics).then(() => {
        finished = true;
    });

    try {
        await new Promise((resolve) => globalThis.setImmediate(resolve));
        assert.equal(statistics.recordCompletedGame.mock.callCount(), 1);
        assert.equal(finished, false);
    } finally {
        finishSlowGame();
        await task;
    }
    assert.equal(finished, true);
});
