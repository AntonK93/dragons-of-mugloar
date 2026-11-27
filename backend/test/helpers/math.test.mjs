import assert from "node:assert/strict";
import { test } from "node:test";
import { InternalServerError } from "../../dist/errors/errors.js";
import { percentage } from "../../dist/helpers/math.js";

test("percentage calculates and rounds the result", () => {
    assert.equal(percentage(1, 3), 33.33);
    assert.equal(percentage(2, 3), 66.67);
    assert.equal(percentage(0, 5), 0);
    assert.equal(percentage(5, 5), 100);
});

test("percentage rejects non-finite values and non-positive totals", () => {
    for (const [count, total] of [
        [NaN, 1],
        [Infinity, 1],
        [1, NaN],
        [1, Infinity],
        [1, 0],
        [1, -1],
    ]) {
        assert.throws(() => percentage(count, total), InternalServerError);
    }
});
