import assert from "node:assert/strict";
import { test } from "node:test";
import { AutoPlayGamesStore } from "../../dist/cache/autoPlayGames.js";

const initialAction = {
    type: "initial",
    result: "Game started",
    score: 0,
    turn: 1,
    stateReputation: 0,
    peopleReputation: 0,
    underworldReputation: 0,
    gold: 0,
    lives: 3,
    timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
};

test("AutoPlayGames stores games and appends action logs", (t) => {
    t.mock.method(Date, "now", () => initialAction.timestamp + 100);
    const games = new AutoPlayGamesStore();
    const action = { ...initialAction, type: "quest", score: 100, turn: 2 };
    games.add("game1", initialAction);
    games.add("game2", { ...initialAction, gold: 20 });

    games.addActionLog("game1", action);
    action.score = 999;

    assert.deepEqual(games.get("game1"), {
        lastUpdate: initialAction.timestamp + 100,
        status: "active",
        actionLogs: [initialAction, { ...action, score: 100 }],
    });
    assert.deepEqual(games.get("game2").actionLogs, [{ ...initialAction, gold: 20 }]);
    assert.deepEqual(
        games.getAll().map(([gameId]) => gameId),
        ["game1", "game2"],
    );
});

test("AutoPlayGames rejects duplicate and missing games", () => {
    const games = new AutoPlayGamesStore();
    games.add("game1", initialAction);

    assert.throws(() => games.add("game1", initialAction), {
        name: "InternalServerError",
        message: "Game already exists for gameId: game1",
    });
    for (const operation of [
        () => games.get("missing"),
        () => games.addActionLog("missing", initialAction),
        () => games.setStatus("missing", "gameOver"),
    ]) {
        assert.throws(operation, {
            name: "NotFoundError",
            message: "No game found for gameId: missing",
        });
    }
    assert.deepEqual(games.get("game1").actionLogs, [initialAction]);
});

test("AutoPlayGames returns snapshots that cannot mutate cached games", () => {
    const games = new AutoPlayGamesStore();
    games.add("game1", initialAction);

    const game = games.get("game1");
    const allGames = games.getAll();
    game.actionLogs[0].score = 100;
    game.actionLogs.push({ ...initialAction, type: "quest" });
    allGames[0][1].actionLogs[0].lives = 0;
    allGames.length = 0;

    assert.deepEqual(games.get("game1").actionLogs, [initialAction]);
    assert.deepEqual(games.getAll(), [["game1", games.get("game1")]]);
});

test("AutoPlayGames deletes only the requested game", () => {
    const games = new AutoPlayGamesStore();
    games.add("game1", initialAction);
    games.add("game2", initialAction);

    assert.equal(games.delete("game1"), true);
    assert.equal(games.delete("game1"), false);
    assert.deepEqual(games.getAll(), [["game2", games.get("game2")]]);
    assert.throws(() => games.get("game1"), { name: "NotFoundError" });
});

test("getActiveGames excludes finished games and returns snapshots", () => {
    const games = new AutoPlayGamesStore();
    games.add("active", initialAction);
    games.add("finished", initialAction);
    games.add("initially-finished", { ...initialAction, type: "gameOver" });
    games.addActionLog("finished", { ...initialAction, type: "gameOver" });
    games.addActionLog("finished", { ...initialAction, type: "quest" });

    const activeGames = games.getActiveGames();
    assert.deepEqual(activeGames, [
        [
            "active",
            {
                lastUpdate: initialAction.timestamp,
                status: "active",
                actionLogs: [initialAction],
            },
        ],
    ]);
    activeGames[0][1].actionLogs[0].lives = 0;
    activeGames[0][1].lastUpdate = 0;
    activeGames[0][1].status = "gameOver";
    assert.equal(games.get("active").actionLogs[0].lives, 3);
    assert.equal(games.getActiveGames()[0][1].status, "active");
    assert.equal(games.getAll().length, 3);
});

test("getActiveGames returns all active games after status changes", () => {
    const games = new AutoPlayGamesStore();
    for (let i = 0; i < 3; i++) {
        games.add(`game-${i}`, initialAction);
    }
    assert.deepEqual(
        games.getActiveGames().map(([gameId]) => gameId),
        ["game-0", "game-1", "game-2"],
    );
    games.setStatus("game-1", "gameOver");
    assert.deepEqual(
        games.getActiveGames().map(([gameId]) => gameId),
        ["game-0", "game-2"],
    );
    assert.equal(games.getAll().length, 3);
});

test("setStatus updates status and lastUpdate without changing the action log", (t) => {
    t.mock.method(Date, "now", () => initialAction.timestamp + 100);
    const games = new AutoPlayGamesStore();
    games.add("active", initialAction);
    games.setStatus("active", "gameOver");
    assert.deepEqual(games.get("active"), {
        status: "gameOver",
        lastUpdate: initialAction.timestamp + 100,
        actionLogs: [initialAction],
    });
    assert.deepEqual(games.getActiveGames(), []);
});

test("modifying the initial action does not change the stored game", () => {
    const games = new AutoPlayGamesStore();
    const initial = { ...initialAction };
    games.add("active", initial);
    initial.timestamp = Date.parse("2026-02-01T00:00:00.000Z");
    assert.deepEqual(games.get("active").actionLogs, [initialAction]);
    assert.equal(games.getActiveGames()[0][1].lastUpdate, initialAction.timestamp);
});
