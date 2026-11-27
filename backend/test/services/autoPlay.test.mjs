import assert from "node:assert/strict";
import { test } from "node:test";
import { AutoPlayService } from "../../dist/services/autoPlay.js";

const initialAction = {
    type: "initial",
    result: "Game started",
    score: 100,
    turn: 1,
    stateReputation: 1,
    peopleReputation: 2,
    underworldReputation: 3,
    gold: 100,
    lives: 3,
    timestamp: "2026-01-01T00:00:00.000Z",
};

/**
 * @param {import("node:test").TestContext} t
 */
const createService = (t, implementations = {}) => {
    const api = {};
    for (const method of [
        "getItems",
        "buyItem",
        "getMessages",
        "investigateReputation",
        "solveMessage",
    ]) {
        api[method] = t.mock.fn(
            implementations[method] ??
                (async () => {
                    throw new Error(`Unexpected ${method} call`);
                }),
        );
    }
    const actions = [];
    const games = {
        addActionLog: t.mock.fn((gameId, action) => actions.push([gameId, action])),
    };
    return { api, actions, service: new AutoPlayService(api, games) };
};

const purchaseResult = {
    shoppingSuccess: true,
    turn: 2,
    gold: 50,
    lives: 3,
    level: 1,
};
const questResult = {
    success: true,
    message: "Success",
    turn: 2,
    gold: 120,
    score: 150,
    lives: 3,
    highScore: 150,
};

test("playTurn does nothing for a finished game", async (t) => {
    const { api, actions, service } = createService(t);

    await service.playTurn("game1", [{ ...initialAction, type: "gameOver" }]);

    assert.equal(actions.length, 0);
    for (const method of Object.values(api)) {
        assert.equal(method.mock.callCount(), 0);
    }
});

test("playTurn buys a healing potion when health is low", async (t) => {
    const { api, actions, service } = createService(t, {
        buyItem: async () => purchaseResult,
    });

    const lastAction = {
        ...initialAction,
        type: "quest",
        lives: 1,
        score: 250,
        stateReputation: 4,
        peopleReputation: 5,
        underworldReputation: 6,
    };
    await service.playTurn("game1", [initialAction, lastAction]);

    assert.deepEqual(api.buyItem.mock.calls[0].arguments, ["game1", "hpot"]);
    assert.equal(api.getItems.mock.callCount(), 0);
    assert.equal(api.getMessages.mock.callCount(), 0);
    const [[gameId, { timestamp, ...action }]] = actions;
    assert.equal(gameId, "game1");
    assert.ok(!Number.isNaN(Date.parse(timestamp)));
    assert.deepEqual(action, {
        type: "purchase",
        result: "You bought item: hpot",
        turn: 2,
        gold: 50,
        lives: 3,
        score: 250,
        stateReputation: 4,
        peopleReputation: 5,
        underworldReputation: 6,
    });
});

test("playTurn buys the most expensive item while reserving gold for a potion", async (t) => {
    const { api, actions, service } = createService(t, {
        getItems: async () => [
            { id: "hpot", name: "Potion", cost: 50 },
            { id: "sword", name: "Sword", cost: 60 },
            { id: "armor", name: "Armor", cost: 100 },
            { id: "shield", name: "Shield", cost: 101 },
        ],
        buyItem: async () => purchaseResult,
    });

    await service.playTurn("game1", [{ ...initialAction, gold: 150 }]);

    assert.deepEqual(api.buyItem.mock.calls[0].arguments, ["game1", "armor"]);
    assert.equal(api.getMessages.mock.callCount(), 0);
    assert.equal(actions[0][1].type, "purchase");
});

test("playTurn chooses the easiest quest, preferring the one that expires sooner", async (t) => {
    const { api, actions, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => [
            {
                adId: "hard",
                message: "Explore",
                probability: "Risky",
                expiresIn: 1,
                reward: 0,
                encrypted: null,
            },
            {
                adId: "later",
                message: "Help",
                probability: "Piece of cake",
                expiresIn: 4,
                reward: 0,
                encrypted: null,
            },
            {
                adId: "first",
                message: "Rescue",
                probability: "Piece of cake",
                expiresIn: 2,
                reward: 0,
                encrypted: null,
            },
        ],
        solveMessage: async () => questResult,
    });

    await service.playTurn("game1", [initialAction]);

    assert.deepEqual(api.solveMessage.mock.calls[0].arguments, ["game1", "first"]);
    assert.equal(api.investigateReputation.mock.callCount(), 0);
    assert.equal(api.buyItem.mock.callCount(), 0);
    const [[gameId, { timestamp, ...action }]] = actions;
    assert.equal(gameId, "game1");
    assert.ok(!Number.isNaN(Date.parse(timestamp)));
    assert.deepEqual(action, {
        type: "quest",
        result: "Quest result: Success - Probability: Piece of cake - Quest message: Rescue",
        turn: 2,
        gold: 120,
        score: 150,
        lives: 3,
        stateReputation: 1,
        peopleReputation: 2,
        underworldReputation: 3,
    });
});

test("playTurn checks reputation and refreshes quests before choosing a safe quest", async (t) => {
    let messageRequests = 0;
    const { api, actions, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => {
            messageRequests++;
            return messageRequests === 1
                ? [
                      {
                          adId: "old",
                          message: "Steal treasure",
                          probability: "Piece of cake",
                          expiresIn: 2,
                          reward: 0,
                          encrypted: null,
                      },
                  ]
                : [
                      {
                          adId: "risky",
                          message: "Infiltrate castle",
                          probability: "Piece of cake",
                          expiresIn: 1,
                          reward: 0,
                          encrypted: null,
                      },
                      {
                          adId: "safe",
                          message: "Help village",
                          probability: "Risky",
                          expiresIn: 3,
                          reward: 0,
                          encrypted: null,
                      },
                  ];
        },
        investigateReputation: async () => ({
            state: -2,
            people: 4,
            underworld: 5,
        }),
        solveMessage: async () => ({ ...questResult, turn: 3 }),
    });

    await service.playTurn("game1", [initialAction]);

    assert.equal(api.getMessages.mock.callCount(), 2);
    assert.deepEqual(api.investigateReputation.mock.calls[0].arguments, ["game1"]);
    assert.deepEqual(api.solveMessage.mock.calls[0].arguments, ["game1", "safe"]);
    assert.deepEqual(
        actions.map(([, action]) => action.type),
        ["reputation", "quest"],
    );
    assert.equal(actions[0][1].turn, 2);
    assert.equal(actions[0][1].stateReputation, -2);
    assert.equal(actions[1][1].turn, 3);
    assert.equal(actions[1][1].stateReputation, -2);
    assert.equal(actions[1][1].peopleReputation, 4);
    assert.equal(actions[1][1].underworldReputation, 5);
});

test("playTurn reports unavailable items and quests without recording an action", async (t) => {
    const noItems = createService(t, { getItems: async () => [] });
    await assert.rejects(() => noItems.service.playTurn("game1", [initialAction]), {
        name: "InternalServerError",
        message: "No items available",
    });
    assert.equal(noItems.actions.length, 0);

    const noQuests = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => [],
    });
    await assert.rejects(() => noQuests.service.playTurn("game1", [initialAction]), {
        name: "InternalServerError",
        message: "No quests available",
    });
    assert.equal(noQuests.actions.length, 0);
});

test("playTurn reports failed purchases without recording an action", async (t) => {
    const { actions, service } = createService(t, {
        buyItem: async () => ({ ...purchaseResult, shoppingSuccess: false }),
    });

    await assert.rejects(() => service.playTurn("game1", [{ ...initialAction, lives: 1 }]), {
        name: "InternalServerError",
        message: "Failed to buy item hpot for game game1",
    });
    assert.equal(actions.length, 0);
});

test("playTurn solves a quest when there is not enough gold for a healing potion", async (t) => {
    const { api, actions, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => [
            {
                adId: "quest1",
                message: "Help",
                probability: "Piece of cake",
                expiresIn: 2,
                reward: 0,
                encrypted: null,
            },
        ],
        solveMessage: async () => questResult,
    });

    await service.playTurn("game1", [{ ...initialAction, lives: 1, gold: 49 }]);

    assert.equal(api.buyItem.mock.callCount(), 0);
    assert.deepEqual(api.solveMessage.mock.calls[0].arguments, ["game1", "quest1"]);
    assert.equal(actions[0][1].type, "quest");
});

test("playTurn can choose a risky quest when state reputation is not negative", async (t) => {
    for (const state of [0, 2]) {
        const { api, actions, service } = createService(t, {
            getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
            getMessages: async () => [
                {
                    adId: "risky",
                    message: "Steal treasure",
                    probability: "Piece of cake",
                    expiresIn: 2,
                    reward: 0,
                    encrypted: null,
                },
                {
                    adId: "safe",
                    message: "Help",
                    probability: "Risky",
                    expiresIn: 1,
                    reward: 0,
                    encrypted: null,
                },
            ],
            investigateReputation: async () => ({ state, people: 1, underworld: 1 }),
            solveMessage: async () => questResult,
        });

        await service.playTurn("game1", [initialAction]);

        assert.equal(api.getMessages.mock.callCount(), 2);
        assert.deepEqual(api.solveMessage.mock.calls[0].arguments, ["game1", "risky"]);
        assert.deepEqual(
            actions.map(([, action]) => action.type),
            ["reputation", "quest"],
        );
        assert.equal(actions[1][1].stateReputation, state);
    }
});

test("playTurn preserves the reputation log when refreshing quests fails", async (t) => {
    let messageRequests = 0;
    const apiError = new Error("Could not refresh quests");
    const { api, actions, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => {
            messageRequests++;
            if (messageRequests === 2) {
                throw apiError;
            }
            return [
                {
                    adId: "risky",
                    message: "Steal treasure",
                    probability: "Piece of cake",
                    expiresIn: 2,
                    reward: 0,
                    encrypted: null,
                },
            ];
        },
        investigateReputation: async () => ({
            state: -2,
            people: 4,
            underworld: 5,
        }),
    });

    await assert.rejects(
        () => service.playTurn("game1", [initialAction]),
        (error) => error === apiError,
    );

    assert.equal(api.getMessages.mock.callCount(), 2);
    assert.equal(api.solveMessage.mock.callCount(), 0);
    assert.deepEqual(
        actions.map(([, action]) => action.type),
        ["reputation"],
    );
    assert.equal(actions[0][1].stateReputation, -2);
    assert.equal(actions[0][1].turn, 2);
});

test("playTurn records an unsuccessful quest result", async (t) => {
    const { actions, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => [
            {
                adId: "quest1",
                message: "Help",
                probability: "Risky",
                expiresIn: 2,
                reward: 0,
                encrypted: null,
            },
        ],
        solveMessage: async () => ({
            ...questResult,
            success: false,
            message: "Failed",
            lives: 2,
        }),
    });

    await service.playTurn("game1", [initialAction]);

    assert.equal(actions.length, 1);
    assert.equal(actions[0][1].type, "quest");
    assert.match(actions[0][1].result, /Quest result: Failed/);
    assert.equal(actions[0][1].lives, 2);
});

test("playTurn prefers known quest probabilities over unknown ones", async (t) => {
    const { api, service } = createService(t, {
        getItems: async () => [{ id: "hpot", name: "Potion", cost: 50 }],
        getMessages: async () => [
            {
                adId: "unknown",
                message: "Explore",
                probability: "Unknown",
                expiresIn: 1,
                reward: 0,
                encrypted: null,
            },
            {
                adId: "known",
                message: "Help",
                probability: "Risky",
                expiresIn: 3,
                reward: 0,
                encrypted: null,
            },
        ],
        solveMessage: async () => questResult,
    });

    await service.playTurn("game1", [initialAction]);

    assert.deepEqual(api.solveMessage.mock.calls[0].arguments, ["game1", "known"]);
});
