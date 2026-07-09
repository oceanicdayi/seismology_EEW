const Animation = {
  _rafId: null,
  _callback: null,

  start(callback) {
    this.stop();
    this._callback = callback;
    const loop = (timestamp) => {
      if (this._callback) this._callback(timestamp);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  },

  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._callback = null;
  },

  isRunning() {
    return this._rafId !== null;
  }
};
