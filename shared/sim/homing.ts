import {
  Entity,
  type HomingBehavior
} from './entity.js';

import { Vector2 } from './vector.js';

export function createHomingBehavior(
  target: Entity
): HomingBehavior {
  return {
    target,

    update(entity: Entity, dt: number): void {
      if (!this.target || !this.target.alive) {
        return;
      }

      const direction = new Vector2(
        this.target.pos.x - entity.pos.x,
        this.target.pos.y - entity.pos.y
      ).normalize();

      const strength = 100;

      entity.vel = new Vector2(
        entity.vel.x +
          direction.x * strength * dt,
        entity.vel.y +
          direction.y * strength * dt
      );
    }
  };
}

export function attachHoming(
  entity: Entity,
  target: Entity
): void {
  entity.homing =
    createHomingBehavior(target);
}