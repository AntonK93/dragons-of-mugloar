import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeBase64, decodeROT13 } from "../../dist/helpers/crypto.js";

test("decodeBase64 decodes ASCII and UTF-8 text", () => {
    assert.equal(decodeBase64("SGVsbG8sIE11Z2xvYXIh"), "Hello, Mugloar!");
    assert.equal(decodeBase64("Q2Fmw6k="), "Café");
    assert.equal(decodeBase64(""), "");
});

test("decodeROT13 preserves case and non-ASCII characters", () => {
    assert.equal(decodeROT13("Uryyb, Jbeyq! 123"), "Hello, World! 123");
    assert.equal(decodeROT13("Nm az"), "Az nm");
    assert.equal(decodeROT13("Pnsé!"), "Café!");
    assert.equal(decodeROT13(""), "");
});
