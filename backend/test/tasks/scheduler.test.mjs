import assert from "node:assert/strict";
import { test } from "node:test";
import { AutoPlayService } from "../../dist/services/autoPlay.js";
import { TaskScheduler } from "../../dist/tasks/scheduler.js";
import { logger } from "../../dist/tools/logger.js";

const flushTasks = () => new Promise((resolve) => globalThis.setImmediate(resolve));

test("TaskScheduler waits for tasks before scheduling the next cycle", async (t) => {
    let finishAutoPlay;
    const autoPlay = t.mock.method(
        AutoPlayService.prototype,
        "playTurn",
        () =>
            new Promise((resolve) => {
                finishAutoPlay = resolve;
            }),
    );
    const setTimer = t.mock.method(globalThis, "setTimeout", () => ({}));
    const clearTimer = t.mock.method(globalThis, "clearTimeout", () => {});
    const gameLog = [{ type: "initial" }];
    const games = {
        getActiveGames: t.mock.fn(() => [["game1", { actionLogs: gameLog }]]),
        getAll: t.mock.fn(() => []),
    };
    const statistics = {};
    const scheduler = new TaskScheduler({}, games, statistics);

    scheduler.start();
    scheduler.start();
    await flushTasks();

    assert.equal(autoPlay.mock.callCount(), 1);
    assert.deepEqual(autoPlay.mock.calls[0].arguments, ["game1", gameLog]);
    assert.equal(games.getAll.mock.callCount(), 1);
    assert.equal(setTimer.mock.callCount(), 0);

    finishAutoPlay();
    await flushTasks();
    assert.equal(setTimer.mock.callCount(), 1);
    assert.equal(setTimer.mock.calls[0].arguments[1], 1000);

    setTimer.mock.calls[0].arguments[0]();
    assert.equal(autoPlay.mock.callCount(), 2);
    assert.equal(games.getAll.mock.callCount(), 2);
    scheduler.stop();
    finishAutoPlay();
    await flushTasks();

    assert.equal(setTimer.mock.callCount(), 1);
    assert.deepEqual(clearTimer.mock.calls[0].arguments, [setTimer.mock.calls[0].result]);
});

test("TaskScheduler logs task failures and continues scheduling", async (t) => {
    const error = new Error("Auto-play failed");
    const logError = t.mock.method(logger, "error", () => {});
    const setTimer = t.mock.method(globalThis, "setTimeout", () => ({}));
    t.mock.method(globalThis, "clearTimeout", () => {});
    const games = {
        getActiveGames: t.mock.fn(() => {
            throw error;
        }),
        getAll: t.mock.fn(() => []),
    };
    const scheduler = new TaskScheduler({}, games, {});

    scheduler.start();
    await flushTasks();
    scheduler.stop();

    assert.deepEqual(logError.mock.calls[0].arguments, [error, "Task auto-play failed:"]);
    assert.equal(games.getAll.mock.callCount(), 1);
    assert.equal(setTimer.mock.callCount(), 1);
    assert.equal(setTimer.mock.calls[0].arguments[1], 1000);
});
