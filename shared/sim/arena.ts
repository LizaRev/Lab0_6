import { Vector2 } from './vector.js';
import { Ship } from './ship.js';

export function wrapShip(
  ship: Ship,
  width: number,
  height: number
): void {
  let x = ship.pos.x;
  let y = ship.pos.y;

  if (x < 0) {
    x += width;
  }

  if (x > width) {
    x -= width;
  }

  if (y < 0) {
    y += height;
  }

  if (y > height) {
    y -= height;
  }

  ship.pos = new Vector2(x, y);
}