import assert from "node:assert/strict";
import { test } from "node:test";
import { AutoPlayGames } from "../../dist/cache/autoPlayGames.js";
import { logger } from "../../dist/tools/logger.js";

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
    timestamp: "2026-01-01T00:00:00.000Z",
};

test("AutoPlayGames stores games and appends action logs", (t) => {
    t.mock.method(logger, "info", () => {});
    const games = new AutoPlayGames();
    const action = { ...initialAction, type: "quest", score: 100, turn: 2 };
    games.add("game1", initialAction);
    games.add("game2", { ...initialAction, gold: 20 });

    games.addActionLog("game1", action);
    action.score = 999;

    assert.deepEqual(games.get("game1"), [initialAction, { ...action, score: 100 }]);
    assert.deepEqual(games.get("game2"), [{ ...initialAction, gold: 20 }]);
    assert.deepEqual(
        games.getAll().map(([gameId]) => gameId),
        ["game1", "game2"],
    );
});

test("AutoPlayGames rejects duplicate and missing games", () => {
    const games = new AutoPlayGames();
    games.add("game1", initialAction);

    assert.throws(() => games.add("game1", initialAction), {
        name: "InternalServerError",
        message: "Game already exists for gameId: game1",
    });
    for (const operation of [
        () => games.get("missing"),
        () => games.addActionLog("missing", initialAction),
    ]) {
        assert.throws(operation, {
            name: "NotFoundError",
            message: "No game found for gameId: missing",
        });
    }
    assert.deepEqual(games.get("game1"), [initialAction]);
});

test("AutoPlayGames returns snapshots that cannot mutate cached games", () => {
    const games = new AutoPlayGames();
    games.add("game1", initialAction);

    const game = games.get("game1");
    const allGames = games.getAll();
    game[0].score = 100;
    game.push({ ...initialAction, type: "quest" });
    allGames[0][1][0].lives = 0;
    allGames.length = 0;

    assert.deepEqual(games.get("game1"), [initialAction]);
    assert.deepEqual(games.getAll(), [["game1", [initialAction]]]);
});

test("AutoPlayGames deletes only the requested game", () => {
    const games = new AutoPlayGames();
    games.add("game1", initialAction);
    games.add("game2", initialAction);

    assert.equal(games.delete("game1"), true);
    assert.equal(games.delete("game1"), false);
    assert.deepEqual(games.getAll(), [["game2", [initialAction]]]);
    assert.throws(() => games.get("game1"), { name: "NotFoundError" });
});
