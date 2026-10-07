import { Entity } from './entity.js';

export class Pickup extends Entity {
  type: string;

  constructor(x: number, y: number, type = 'shield') {
    super(x, y, 0, 0, 0, 15, 'pickup');

    this.type = type;
  }

  update(dt: number): void {
  }
}
