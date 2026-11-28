import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { InternalServerError } from "../../dist/errors/errors.js";
import { createStatistics, GameStatistics } from "../../dist/services/gameStatistics.js";
import { config } from "../../dist/config.js";

const createTemporaryDirectory = (t) => {
    const directory = mkdtempSync(join(tmpdir(), "game-statistics-test-"));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    return directory;
};

test("statistics path points to the repository root regardless of the working directory", (t) => {
    const configUrl = new globalThis.URL("../../dist/config.js", import.meta.url).href;
    const expected = fileURLToPath(
        new globalThis.URL("../../../game-statistics.json", import.meta.url),
    );
    const actual = execFileSync(
        globalThis.process.execPath,
        [
            "--input-type=module",
            "-e",
            "process.stdout.write((await import(process.argv[1])).config.statisticsPath)",
            configUrl,
        ],
        { cwd: createTemporaryDirectory(t), encoding: "utf8" },
    );
    assert.equal(actual, expected);
});

test("createStatistics uses the configured path", (t) => {
    const file = join(createTemporaryDirectory(t), "statistics.json");
    const previous = config.statisticsPath;
    config.statisticsPath = file;
    try {
        createStatistics().recordCompletedGame("game1", 100);
        assert.equal(JSON.parse(readFileSync(file, "utf8")).completedGames, 1);
    } finally {
        config.statisticsPath = previous;
    }
});

test("recordCompletedGame creates and updates statistics across score boundaries", (t) => {
    const file = join(createTemporaryDirectory(t), "statistics.json");
    const statistics = new GameStatistics(file);

    statistics.recordCompletedGame("game1", 999);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
        below1000Percent: 100,
        between1000To1999Percent: 0,
        from2000Percent: 0,
        completedGames: 1,
        counts: { below1000: 1, between1000To1999: 0, from2000: 0 },
    });

    statistics.recordCompletedGame("game2", 1000);
    statistics.recordCompletedGame("game3", 1999);
    new GameStatistics(file).recordCompletedGame("game4", 2000);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
        below1000Percent: 25,
        between1000To1999Percent: 50,
        from2000Percent: 25,
        completedGames: 4,
        counts: { below1000: 1, between1000To1999: 2, from2000: 1 },
    });
});

test("recordCompletedGame rejects invalid game IDs and scores", (t) => {
    const file = join(createTemporaryDirectory(t), "statistics.json");
    const statistics = new GameStatistics(file);

    for (const [gameId, score] of [
        ["", 100],
        ["game1", NaN],
        ["game1", Infinity],
    ]) {
        assert.throws(() => statistics.recordCompletedGame(gameId, score), InternalServerError);
    }
    assert.equal(existsSync(file), false);
});

test("recordCompletedGame rejects invalid existing statistics without overwriting them", (t) => {
    const file = join(createTemporaryDirectory(t), "statistics.json");
    const statistics = new GameStatistics(file);

    for (const contents of ["{", "{}"]) {
        writeFileSync(file, contents);
        assert.throws(
            () => statistics.recordCompletedGame("game1", 100),
            /Invalid game statistics file/,
        );
        assert.equal(readFileSync(file, "utf8"), contents);
    }
});

test("recordCompletedGame reports read errors other than a missing file", (t) => {
    const directory = createTemporaryDirectory(t);
    const statistics = new GameStatistics(directory);

    assert.throws(
        () => statistics.recordCompletedGame("game1", 100),
        /Failed to read game statistics/,
    );
});
