import test from "node:test";

import assert from "node:assert/strict";

import {
  encodeSnapshot,
  decodeSnapshot,
} from "../../shared/protocol/binary.js";

import type {
  SnapshotMessageWithWorld,
} from "../../shared/protocol/binary.js";

test("binary snapshot encode/decode keeps data", () => {
  const snapshot: SnapshotMessageWithWorld = {
    version: 1,

    type: "snapshot",

    roomId: "alpha",

    playerId: "player-1",

    playerShipId: "1",

    lastProcessedSeq: 5,

    world: {
      width: 800,

      height: 500,

      score: 100,

      entities: [
        {
          id: "1",

          kind: "ship",

          x: 100,

          y: 200,

          angle: 1,

          vx: 10,

          vy: 20,

          radius: 20,

          hp: 3,

          thrust: 0.5,

          shield: true,

          alive: true,
        },
      ],
    },
  };

  const encoded = encodeSnapshot(snapshot);

  const decoded = decodeSnapshot(encoded);

  assert.equal(
    decoded.version,
    snapshot.version
  );

  assert.equal(
    decoded.type,
    snapshot.type
  );

  assert.equal(
    decoded.roomId,
    snapshot.roomId
  );

  assert.equal(
    decoded.lastProcessedSeq,
    snapshot.lastProcessedSeq
  );

  assert.equal(
    decoded.playerShipId,
    "1"
  );

  assert.equal(
    decoded.world.width,
    snapshot.world.width
  );

  assert.equal(
    decoded.world.height,
    snapshot.world.height
  );

  assert.equal(
    decoded.world.score,
    snapshot.world.score
  );

  assert.equal(
    decoded.world.entities.length,
    1
  );

  const entity =
    decoded.world.entities[0];

  assert.ok(entity);

  assert.equal(
    entity.id,
    "1"
  );

  assert.equal(
    entity.kind,
    "ship"
  );

  assert.equal(
    entity.x,
    100
  );

  assert.equal(
    entity.y,
    200
  );

  assert.equal(
    entity.vx,
    10
  );

  assert.equal(
    entity.vy,
    20
  );

  assert.equal(
    entity.radius,
    20
  );

  assert.equal(
    entity.hp,
    3
  );

  assert.equal(
    entity.thrust,
    0.5
  );

  assert.ok(
    Math.abs(
      (entity.angle ?? 0) - 1
    ) < 0.001
  );
});