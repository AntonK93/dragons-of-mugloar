import assert from "node:assert/strict";
import { test } from "node:test";
import { GameApiError } from "../../dist/errors/gameApiError.js";
import { autoPlayTask } from "../../dist/tasks/autoPlayTask.js";
import { logger } from "../../dist/tools/logger.js";

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
    timestamp: "2026-01-01T00:00:00.000Z",
};

test("autoPlayTask runs a turn for each game", async (t) => {
    const firstLog = [initialAction];
    const secondLog = [{ ...initialAction, score: 200 }];
    const autoPlay = { playTurn: t.mock.fn(async () => {}) };
    const games = {
        getAll: () => [
            ["game1", firstLog],
            ["game2", secondLog],
        ],
        addActionLog: t.mock.fn(),
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
        getAll: () => [["game1", [initialAction, lastAction]]],
        addActionLog: t.mock.fn(),
    };
    const statistics = { recordCompletedGame: t.mock.fn() };

    await autoPlayTask(autoPlay, games, statistics);

    assert.deepEqual(logError.mock.calls[0].arguments, [
        error,
        "Failed to play turn for game game1",
    ]);
    assert.deepEqual(statistics.recordCompletedGame.mock.calls[0].arguments, ["game1", 250]);
    const [gameId, { timestamp, ...action }] = games.addActionLog.mock.calls[0].arguments;
    assert.equal(gameId, "game1");
    assert.ok(!Number.isNaN(Date.parse(timestamp)));
    assert.deepEqual(action, {
        type: "gameOver",
        result: "Your adventure has come to an end.",
        score: 250,
        turn: 3,
        gold: 10,
        lives: 3,
        stateReputation: 0,
        peopleReputation: 0,
        underworldReputation: 0,
    });
});

test("autoPlayTask logs other errors without ending the game", async (t) => {
    const error = new Error("Network unavailable");
    const logError = t.mock.method(logger, "error", () => {});
    const autoPlay = {
        playTurn: t.mock.fn(async () => {
            throw error;
        }),
    };
    const games = { getAll: () => [["game1", [initialAction]]], addActionLog: t.mock.fn() };
    const statistics = { recordCompletedGame: t.mock.fn() };

    await autoPlayTask(autoPlay, games, statistics);

    assert.deepEqual(logError.mock.calls[0].arguments, [
        error,
        "Failed to play turn for game game1",
    ]);
    assert.equal(games.addActionLog.mock.callCount(), 0);
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
        getAll: () => [
            ["slow", [initialAction]],
            ["ended", [initialAction]],
        ],
        addActionLog: t.mock.fn(),
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
