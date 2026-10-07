import type { Entity } from './entity.js';
import { Vector2 } from './vector.js';

export function wrapShip(
  ship: Entity,
  width: number,
  height: number
): void {
  if (ship.pos.x < 0) {
    ship.pos = new Vector2(
      ship.pos.x + width,
      ship.pos.y
    );
  }

  if (ship.pos.x > width) {
    ship.pos = new Vector2(
      ship.pos.x - width,
      ship.pos.y
    );
  }

  if (ship.pos.y < 0) {
    ship.pos = new Vector2(
      ship.pos.x,
      ship.pos.y + height
    );
  }

  if (ship.pos.y > height) {
    ship.pos = new Vector2(
      ship.pos.x,
      ship.pos.y - height
    );
  }
}