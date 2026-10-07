export function createCanvas() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('Не вдалося отримати 2D canvas context');
  }

  const ctx: CanvasRenderingContext2D = context;

  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  document.body.appendChild(canvas);

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);

  resize();

  return {
    canvas,
    ctx,

    get width(): number {
      return window.innerWidth;
    },

    get height(): number {
      return window.innerHeight;
    }
  };
}