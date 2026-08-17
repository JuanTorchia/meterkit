import assert from "node:assert/strict";
import test from "node:test";
import {
  appendExceptionLifecycle,
  validateRiskException,
} from "./exceptions.mjs";

test("requires independent approval, controls and a future expiry", () => {
  const result = validateRiskException(
    {
      owner: "owner",
      approver: "owner",
      compensatingControls: [],
      expiresAt: "2026-08-16T00:00:00.000Z",
      reviewTrigger: "",
    },
    { now: new Date("2026-08-17T00:00:00.000Z") },
  );
  assert.deepEqual(
    result.errors.map(({ code }) => code),
    [
      "EXCEPTION_APPROVAL_REQUIRED",
      "COMPENSATING_CONTROL_REQUIRED",
      "EXCEPTION_EXPIRED",
      "REVIEW_TRIGGER_REQUIRED",
    ],
  );
});

test("appends lifecycle events without mutating history or accepting time regression", () => {
  const history = [
    { at: "2026-08-17T00:00:00.000Z", status: "active", actor: "reviewer" },
  ];
  const next = appendExceptionLifecycle(history, {
    at: "2026-08-18T00:00:00.000Z",
    status: "closed",
    actor: "reviewer",
  });
  assert.equal(history.length, 1);
  assert.equal(next.length, 2);
  assert.throws(
    () =>
      appendExceptionLifecycle(next, {
        at: "2026-08-16T00:00:00.000Z",
        status: "active",
        actor: "reviewer",
      }),
    /EXCEPTION_HISTORY_REGRESSION/,
  );
});
