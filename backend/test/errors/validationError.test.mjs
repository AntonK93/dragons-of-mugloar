import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../dist/errors/errors.js";
import { ValidationError, schemaErrorFormatter } from "../../dist/errors/validationError.js";

test("ValidationError formats validation messages and paths", () => {
    const error = new ValidationError([
        { instancePath: "/user/name", params: {}, message: "must be a string" },
        { instancePath: "/profile", params: { missingProperty: "age" }, message: "is required" },
        { instancePath: "/a~1b/~0key", params: {} },
        { instancePath: "", params: {}, message: "invalid root" },
    ]);

    assert.ok(error instanceof AppError);
    assert.equal(error.name, "ValidationError");
    assert.equal(error.statusCode, 400);
    assert.equal(error.message, "Request validation failed");
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.deepEqual(error.details, [
        { path: "user.name", message: "must be a string" },
        { path: "profile.age", message: "is required" },
        { path: "a/b.~key", message: "Invalid value" },
        { path: "", message: "invalid root" },
    ]);
});

test("schemaErrorFormatter creates a ValidationError", () => {
    const error = schemaErrorFormatter([
        { instancePath: "", params: { missingProperty: "gameId" }, message: "is required" },
    ]);

    assert.ok(error instanceof ValidationError);
    assert.deepEqual(error.details, [{ path: "gameId", message: "is required" }]);
});

test("ValidationError ignores non-string missing properties and accepts an empty list", () => {
    const error = new ValidationError([
        { instancePath: "/user", params: { missingProperty: null }, message: "invalid" },
    ]);

    assert.deepEqual(error.details, [{ path: "user", message: "invalid" }]);
    assert.deepEqual(new ValidationError([]).details, []);
});
