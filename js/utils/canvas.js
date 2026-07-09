const CanvasUtils = {
  setupCanvas(canvas, container) {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height, dpr };
  },

  clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  },

  drawGrid(ctx, w, h, stepX, stepY, color) {
    ctx.strokeStyle = color || 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += stepX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += stepY) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
};
