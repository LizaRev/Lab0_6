export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(other: Vector2): Vector2 {
    return new Vector2(
      this.x + other.x,
      this.y + other.y
    );
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(
      this.x - other.x,
      this.y - other.y
    );
  }

  scale(value: number): Vector2 {
    return new Vector2(
      this.x * value,
      this.y * value
    );
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): Vector2 {
    const length = this.length();

    if (length === 0) {
      return new Vector2(0, 0);
    }

    return new Vector2(
      this.x / length,
      this.y / length
    );
  }

  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(
      Math.cos(angle),
      Math.sin(angle)
    );
  }
}

