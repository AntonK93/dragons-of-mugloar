import assert from "node:assert/strict";
import { test } from "node:test";
import { formatNumberToDecimalPlaces } from "../../dist/helpers/format.js";

test("formatNumberToDecimalPlaces rounds numbers to the requested precision", () => {
    assert.equal(formatNumberToDecimalPlaces(12.346, 2), 12.35);
    assert.equal(formatNumberToDecimalPlaces(-7.126, 2), -7.13);
    assert.equal(formatNumberToDecimalPlaces(3.6, 0), 4);
    assert.equal(formatNumberToDecimalPlaces(4.5, 3), 4.5);
});
