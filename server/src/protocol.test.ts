import test from "node:test";
import assert from "node:assert/strict";

import {
  MESSAGE_TYPES,
  parseClientMessage,
} from "./protocol.js";

test("parseClientMessage accepts valid join message", () => {
  const result = parseClientMessage({
    version: 1,
    type: MESSAGE_TYPES.JOIN,
    roomId: "alpha",
    name: "Liza",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.message.type, MESSAGE_TYPES.JOIN);
    assert.equal(result.message.roomId, "alpha");
    assert.equal(result.message.name, "Liza");
  }
});

test("parseClientMessage rejects invalid message", () => {
  const result = parseClientMessage({
    version: 999,
    type: MESSAGE_TYPES.JOIN,
    roomId: "alpha",
    name: "Liza",
  });

  assert.equal(result.ok, false);
});

test("parseClientMessage rejects unsupported server message", () => {
  const result = parseClientMessage({
    version: 1,
    type: MESSAGE_TYPES.ROSTER,
    roomId: "alpha",
    players: [],
  });

  assert.equal(result.ok, false);
});