import { Vector2 } from './vector.js';
import type { Entity } from './entity.js';

type HomingBehavior = {
  target: Entity | null;

  update(
    entity: Entity,
    dt: number
  ): void;
};

export function createHomingBehavior(
  target: Entity | null
): HomingBehavior {
  return {
    target,

    update(
      entity: Entity,
      dt: number
    ): void {
      if (
        !this.target ||
        !this.target.alive
      ) {
        return;
      }

      const direction =
        new Vector2(
          this.target.pos.x -
            entity.pos.x,
          this.target.pos.y -
            entity.pos.y
        ).normalize();

      const strength = 100;

      const newVelocity =
        new Vector2(
          entity.vel.x +
            direction.x *
            strength *
            dt,

          entity.vel.y +
            direction.y *
            strength *
            dt
        );

      entity.vel = newVelocity;
    }
  };
}

export function attachHoming(
  entity: Entity & {
    homing?: HomingBehavior | null;
  },
  target: Entity | null
): void {
  entity.homing =
    createHomingBehavior(target);
}