import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const autoPlayTask = require("../../dist/tasks/autoPlayTask.js");
const cleanupTask = require("../../dist/tasks/cleanupTask.js");
const { TaskScheduler } = require("../../dist/tasks/scheduler.js");
const { logger } = require("../../dist/tools/logger.js");

const flushTasks = () => new Promise((resolve) => globalThis.setImmediate(resolve));

test("TaskScheduler waits for tasks before scheduling the next cycle", async (t) => {
    let finishAutoPlay;
    const autoPlay = t.mock.method(
        autoPlayTask,
        "autoPlayTask",
        () =>
            new Promise((resolve) => {
                finishAutoPlay = resolve;
            }),
    );
    const cleanup = t.mock.method(cleanupTask, "cleanupTask", async () => {});
    const setTimer = t.mock.method(globalThis, "setTimeout", () => ({}));
    const clearTimer = t.mock.method(globalThis, "clearTimeout", () => {});
    const games = {};
    const statistics = {};
    const scheduler = new TaskScheduler({}, games, statistics);

    scheduler.start();
    scheduler.start();
    await flushTasks();

    assert.equal(autoPlay.mock.callCount(), 1);
    assert.deepEqual(autoPlay.mock.calls[0].arguments.slice(1), [games, statistics]);
    assert.deepEqual(cleanup.mock.calls[0].arguments, [games]);
    assert.equal(setTimer.mock.callCount(), 0);

    finishAutoPlay();
    await flushTasks();
    assert.equal(setTimer.mock.callCount(), 1);
    assert.equal(setTimer.mock.calls[0].arguments[1], 1000);

    setTimer.mock.calls[0].arguments[0]();
    assert.equal(autoPlay.mock.callCount(), 2);
    assert.equal(cleanup.mock.callCount(), 2);
    scheduler.stop();
    finishAutoPlay();
    await flushTasks();

    assert.equal(setTimer.mock.callCount(), 1);
    assert.deepEqual(clearTimer.mock.calls[0].arguments, [setTimer.mock.calls[0].result]);
});

test("TaskScheduler logs task failures and continues scheduling", async (t) => {
    const error = new Error("Auto-play failed");
    t.mock.method(autoPlayTask, "autoPlayTask", async () => {
        throw error;
    });
    const cleanup = t.mock.method(cleanupTask, "cleanupTask", async () => {});
    const logError = t.mock.method(logger, "error", () => {});
    const setTimer = t.mock.method(globalThis, "setTimeout", () => ({}));
    t.mock.method(globalThis, "clearTimeout", () => {});
    const scheduler = new TaskScheduler({}, {}, {});

    scheduler.start();
    await flushTasks();
    scheduler.stop();

    assert.deepEqual(logError.mock.calls[0].arguments, [error, "Task auto-play failed:"]);
    assert.equal(cleanup.mock.callCount(), 1);
    assert.equal(setTimer.mock.callCount(), 1);
    assert.equal(setTimer.mock.calls[0].arguments[1], 1000);
});
