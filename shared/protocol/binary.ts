import type {
  InputMessage,
  SnapshotMessage,
  Message,
} from './messages.js';

import type { Seq } from '../types.js';

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export const BINARY_CODEC_VERSION = 1;

export const BINARY_MESSAGE: {
  readonly INPUT: 1;
  readonly SNAPSHOT: 2;
} = {
  INPUT: 1,
  SNAPSHOT: 2,
};

type SnapshotEntityKind =
  | 'entity'
  | 'ship'
  | 'asteroid'
  | 'bullet'
  | 'pickup'
  | 'explosion';

const TWO_PI = Math.PI * 2;

function assertNever(
  value: never
): never {
  throw new Error(
    `Unexpected value: ${String(value)}`
  );
}

function isSnapshotEntityKind(
  value: string
): value is SnapshotEntityKind {
  switch (value) {
    case 'entity':
    case 'ship':
    case 'asteroid':
    case 'bullet':
    case 'pickup':
    case 'explosion':
      return true;

    default:
      return false;
  }
}

function quantizeAngle(
  angle: number
): number {
  const normalized =
    ((Number(angle) % TWO_PI) + TWO_PI) %
    TWO_PI;

  return Math.round(
    (normalized / TWO_PI) * 65535
  );
}

function dequantizeAngle(
  value: number
): number {
  return (
    (value / 65535) * TWO_PI
  );
}

class Writer {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset = 0;

  constructor(size = 1024) {
    this.buffer =
      new ArrayBuffer(size);

    this.view =
      new DataView(this.buffer);
  }

  private ensure(
    bytes: number
  ): void {
    if (
      this.offset + bytes <=
      this.buffer.byteLength
    ) {
      return;
    }

    let size =
      this.buffer.byteLength;

    while (
      size <
      this.offset + bytes
    ) {
      size *= 2;
    }

    const next =
      new ArrayBuffer(size);

    new Uint8Array(next).set(
      new Uint8Array(this.buffer)
    );

    this.buffer = next;
    this.view =
      new DataView(next);
  }

  u8(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 255
    ) {
      throw new Error(
        `u8 value out of range: ${value}`
      );
    }

    this.ensure(1);

    this.view.setUint8(
      this.offset,
      value
    );

    this.offset += 1;
  }

  u16(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 65535
    ) {
      throw new Error(
        `u16 value out of range: ${value}`
      );
    }

    this.ensure(2);

    this.view.setUint16(
      this.offset,
      value,
      true
    );

    this.offset += 2;
  }

  i32(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < -2147483648 ||
      value > 2147483647
    ) {
      throw new Error(
        `i32 value out of range: ${value}`
      );
    }

    this.ensure(4);

    this.view.setInt32(
      this.offset,
      value,
      true
    );

    this.offset += 4;
  }

  u32(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 4294967295
    ) {
      throw new Error(
        `u32 value out of range: ${value}`
      );
    }

    this.ensure(4);

    this.view.setUint32(
      this.offset,
      value,
      true
    );

    this.offset += 4;
  }

  f32(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error(
        `f32 value must be finite: ${value}`
      );
    }

    this.ensure(4);

    this.view.setFloat32(
      this.offset,
      value,
      true
    );

    this.offset += 4;
  }

  string(value: string): void {
    const bytes =
      TEXT_ENCODER.encode(value);

    if (bytes.length > 65535) {
      throw new Error(
        'Binary string is too long'
      );
    }

    this.u16(bytes.length);

    this.ensure(bytes.length);

    new Uint8Array(
      this.buffer,
      this.offset,
      bytes.length
    ).set(bytes);

    this.offset += bytes.length;
  }

  finish(): ArrayBuffer {
    return this.buffer.slice(
      0,
      this.offset
    );
  }
}

class Reader {
  private readonly buffer: ArrayBuffer;
  private readonly view: DataView;
  private offset = 0;

  constructor(
    buffer: ArrayBuffer | Uint8Array
  ) {
    if (
      buffer instanceof Uint8Array
    ) {
      const copy =
        new Uint8Array(
          buffer.byteLength
        );

      copy.set(buffer);

      this.buffer =
        copy.buffer;
    } else {
      this.buffer = buffer;
    }

    this.view =
      new DataView(
        this.buffer
      );
  }

  private ensure(
    bytes: number
  ): void {
    if (
      this.offset + bytes >
      this.view.byteLength
    ) {
      throw new Error(
        'Unexpected end of binary message'
      );
    }
  }

  u8(): number {
    this.ensure(1);

    const value =
      this.view.getUint8(
        this.offset
      );

    this.offset += 1;

    return value;
  }

  u16(): number {
    this.ensure(2);

    const value =
      this.view.getUint16(
        this.offset,
        true
      );

    this.offset += 2;

    return value;
  }

  i32(): number {
    this.ensure(4);

    const value =
      this.view.getInt32(
        this.offset,
        true
      );

    this.offset += 4;

    return value;
  }

  u32(): number {
    this.ensure(4);

    const value =
      this.view.getUint32(
        this.offset,
        true
      );

    this.offset += 4;

    return value;
  }

  f32(): number {
    this.ensure(4);

    const value =
      this.view.getFloat32(
        this.offset,
        true
      );

    if (!Number.isFinite(value)) {
      throw new Error(
        'Invalid non-finite f32 value'
      );
    }

    this.offset += 4;

    return value;
  }

  string(): string {
    const length =
      this.u16();

    this.ensure(length);

    const bytes =
      new Uint8Array(
        this.buffer,
        this.offset,
        length
      );

    const value =
      TEXT_DECODER.decode(bytes);

    this.offset += length;

    return value;
  }

  done(): boolean {
    return (
      this.offset ===
      this.view.byteLength
    );
  }
}

export function encodeInput(
  message: InputMessage
): ArrayBuffer {
  const writer =
    new Writer(16);

  writer.u8(
    BINARY_CODEC_VERSION
  );

  writer.u8(
    BINARY_MESSAGE.INPUT
  );

  writer.u32(
    message.seq
  );

  let flags = 0;

  if (message.input.left) {
    flags |= 1;
  }

  if (message.input.right) {
    flags |= 2;
  }

  if (message.input.thrust) {
    flags |= 4;
  }

  if (message.input.fire) {
    flags |= 8;
  }

  writer.u8(flags);

  return writer.finish();
}

export function decodeInput(
  buffer: ArrayBuffer | Uint8Array
): InputMessage {
  const reader =
    new Reader(buffer);

  const version =
    reader.u8();

  if (
    version !==
    BINARY_CODEC_VERSION
  ) {
    throw new Error(
      `Unsupported binary codec version: ${version}`
    );
  }

  const type =
    reader.u8();

  if (
    type !==
    BINARY_MESSAGE.INPUT
  ) {
    throw new Error(
      'Not a binary input message'
    );
  }

  const seqValue =
    reader.u32();

  const seq =
    seqValue as Seq;

  const flags =
    reader.u8();

  if (!reader.done()) {
    throw new Error(
      'Unexpected bytes after input message'
    );
  }

  return {
    version: 1,
    type: 'input',
    seq,
    input: {
      left: Boolean(flags & 1),
      right: Boolean(flags & 2),
      thrust: Boolean(flags & 4),
      fire: Boolean(flags & 8),
    },
  };
}

type SnapshotEntityBase = {
  id: string;
  x: number;
  y: number;
  angle?: number;
  vx: number;
  vy: number;
  radius: number;

  hp?: number;
  thrust?: number;
  type?: string;
  ttl?: number;
};

type SnapshotGenericEntity =
  SnapshotEntityBase & {
    kind: 'entity';
  };

type SnapshotShip =
  SnapshotEntityBase & {
    kind: 'ship';
  };

type SnapshotAsteroid =
  SnapshotEntityBase & {
    kind: 'asteroid';
  };

type SnapshotBullet =
  SnapshotEntityBase & {
    kind: 'bullet';
  };

type SnapshotPickup =
  SnapshotEntityBase & {
    kind: 'pickup';
  };

type SnapshotExplosion =
  SnapshotEntityBase & {
    kind: 'explosion';
  };

export type SnapshotEntity =
  | SnapshotGenericEntity
  | SnapshotShip
  | SnapshotAsteroid
  | SnapshotBullet
  | SnapshotPickup
  | SnapshotExplosion;

export type SnapshotMessageWithWorld =
  SnapshotMessage & {
    roomId: string;
    playerShipId: string | null;
    world: {
      width: number;
      height: number;
      score: number;
      entities: SnapshotEntity[];
    };
  };

export function encodeSnapshot(
  message: SnapshotMessageWithWorld
): ArrayBuffer {
  const entities =
    message.world.entities;

  if (entities.length > 65535) {
    throw new Error(
      'Too many entities in snapshot'
    );
  }

  const writer =
    new Writer(
      256 +
      entities.length * 64
    );

  writer.u8(
    BINARY_CODEC_VERSION
  );

  writer.u8(
    BINARY_MESSAGE.SNAPSHOT
  );

  writer.string(
    message.roomId
  );

  writer.string(
    message.playerShipId ?? ''
  );

  writer.i32(
    message.lastProcessedSeq
  );

  writer.f32(
    message.world.width
  );

  writer.f32(
    message.world.height
  );

  writer.f32(
    message.world.score
  );

  writer.u16(
    entities.length
  );

  for (const entity of entities) {
    writer.string(entity.id);
    writer.string(entity.kind);

    writer.f32(entity.x);
    writer.f32(entity.y);

    writer.u16(
      quantizeAngle(
        entity.angle ?? 0
      )
    );

    writer.f32(entity.vx);
    writer.f32(entity.vy);
    writer.f32(entity.radius);

    let flags = 0;

    if (
      entity.hp !== undefined
    ) {
      flags |= 1;
    }

    if (
      entity.thrust !== undefined
    ) {
      flags |= 2;
    }

    if (
      entity.type !== undefined
    ) {
      flags |= 4;
    }

    if (
      entity.ttl !== undefined
    ) {
      flags |= 8;
    }

    writer.u8(flags);

    if (flags & 1) {
      writer.f32(
        entity.hp ?? 0
      );
    }

    if (flags & 2) {
      writer.f32(
        entity.thrust ?? 0
      );
    }

    if (flags & 4) {
      writer.string(
        entity.type ?? ''
      );
    }

    if (flags & 8) {
      writer.f32(
        entity.ttl ?? 0
      );
    }
  }

  return writer.finish();
}

export function decodeSnapshot(
  buffer: ArrayBuffer | Uint8Array
): SnapshotMessageWithWorld {
  const reader =
    new Reader(buffer);

  const version =
    reader.u8();

  if (
    version !==
    BINARY_CODEC_VERSION
  ) {
    throw new Error(
      `Unsupported binary codec version: ${version}`
    );
  }

  const type =
    reader.u8();

  if (
    type !==
    BINARY_MESSAGE.SNAPSHOT
  ) {
    throw new Error(
      'Not a binary snapshot message'
    );
  }

  const roomId =
    reader.string();

  const playerShipId =
    reader.string();

  const lastProcessedSeq =
    reader.i32() as Seq;

  const width =
    reader.f32();

  const height =
    reader.f32();

  const score =
    reader.f32();

  const entityCount =
    reader.u16();

  const entities:
    SnapshotEntity[] = [];

  for (
    let i = 0;
    i < entityCount;
    i++
  ) {
    const id =
      reader.string();

    const kind =
      reader.string();

    if (
      !isSnapshotEntityKind(kind)
    ) {
      throw new Error(
        `Unknown snapshot entity kind: ${kind}`
      );
    }

    const x =
      reader.f32();

    const y =
      reader.f32();

    const angle =
      dequantizeAngle(
        reader.u16()
      );

    const vx =
      reader.f32();

    const vy =
      reader.f32();

    const radius =
      reader.f32();

    const flags =
      reader.u8();

    const entityBase = {
      id,
      x,
      y,
      angle,
      vx,
      vy,
      radius,
    };

    let entity:
      SnapshotEntity;

    switch (kind) {
      case 'ship': {
        const ship:
          SnapshotShip = {
          ...entityBase,
          kind: 'ship',
        };

        if (flags & 1) {
          ship.hp =
            reader.f32();
        }

        if (flags & 2) {
          ship.thrust =
            reader.f32();
        }

        entity = ship;
        break;
      }

      case 'asteroid': {
        const asteroid:
          SnapshotAsteroid = {
          ...entityBase,
          kind: 'asteroid',
        };

        if (flags & 1) {
          asteroid.hp =
            reader.f32();
        }

        entity = asteroid;
        break;
      }

      case 'bullet': {
        const bullet:
          SnapshotBullet = {
          ...entityBase,
          kind: 'bullet',
        };

        if (flags & 8) {
          bullet.ttl =
            reader.f32();
        }

        entity = bullet;
        break;
      }

      case 'pickup': {
        const pickup:
          SnapshotPickup = {
          ...entityBase,
          kind: 'pickup',
        };

        if (flags & 4) {
          pickup.type =
            reader.string();
        }

        entity = pickup;
        break;
      }

      case 'explosion': {
        entity = {
          ...entityBase,
          kind: 'explosion',
        };
        break;
      }

      case 'entity': {
        entity = {
          ...entityBase,
          kind: 'entity',
        };
        break;
      }

      default:
        assertNever(kind);
    }

    if (
      kind !== 'ship' &&
      kind !== 'asteroid' &&
      flags & 1
    ) {
      reader.f32();
    }

    if (
      kind !== 'ship' &&
      flags & 2
    ) {
      reader.f32();
    }

    if (
      kind !== 'pickup' &&
      flags & 4
    ) {
      reader.string();
    }

    if (
      kind !== 'bullet' &&
      flags & 8
    ) {
      reader.f32();
    }

    entities.push(entity);
  }

  if (!reader.done()) {
    throw new Error(
      'Unexpected bytes after snapshot message'
    );
  }

  return {
    version: 1,
    type: 'snapshot',
    roomId,
    playerShipId:
      playerShipId || null,
    lastProcessedSeq,
    world: {
      width,
      height,
      score,
      entities,
    },
  };
}

export function encodeBinaryMessage(
  message: Message
): ArrayBuffer {
  switch (message.type) {
    case 'input':
      return encodeInput(message);

    case 'snapshot':
      throw new Error(
        'Snapshot message requires world data'
      );

    case 'join':
    case 'leave':
    case 'chat':
    case 'ping':
    case 'pong':
    case 'error':
    case 'roster':
      throw new Error(
        `Unsupported binary message type: ${message.type}`
      );

    default: {
      const neverMessage:
        never = message;

      throw new Error(
        `Unsupported binary message type: ${String(neverMessage)}`
      );
    }
  }
}

export function decodeBinaryMessage(
  buffer: ArrayBuffer | Uint8Array
): Message {
  const reader =
    new Reader(buffer);

  const version =
    reader.u8();

  const type =
    reader.u8();

  if (
    version !==
    BINARY_CODEC_VERSION
  ) {
    throw new Error(
      `Unsupported binary codec version: ${version}`
    );
  }

  if (
    type ===
    BINARY_MESSAGE.INPUT
  ) {
    return decodeInput(buffer);
  }

  if (
    type ===
    BINARY_MESSAGE.SNAPSHOT
  ) {
    return decodeSnapshot(buffer);
  }

  throw new Error(
    `Unknown binary message type: ${type}`
  );
}