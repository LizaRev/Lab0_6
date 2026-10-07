export function createInput(target: Window) {
  const keys = new Set<string>();
  const justPressedKeys = new Set<string>();

  function onKeyDown(event: KeyboardEvent): void {
    if (!keys.has(event.code)) {
      justPressedKeys.add(event.code);
    }

    keys.add(event.code);

    if (event.code === "Space") {
      event.preventDefault();
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    keys.delete(event.code);
  }

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);

  return {
    isDown(code: string): boolean {
      return keys.has(code);
    },

    justPressed(code: string): boolean {
      return justPressedKeys.has(code);
    },

    endFrame(): void {
      justPressedKeys.clear();
    },
  };
}