window.ExhibitMockEffects = {
  mount(canvas) {
    const ctx = canvas.getContext('2d');
    const atlas = new Image();
    atlas.src = 'assets/demo/umbrella-exhibit.png';
    return {
      play(row, target) {
        if (!atlas.complete || !atlas.naturalWidth) return Promise.resolve();
        const area = canvas.getBoundingClientRect();
        const actor = target.getBoundingClientRect();
        canvas.width = Math.round(area.width);
        canvas.height = Math.round(area.height);
        ctx.imageSmoothingEnabled = false;
        const tile = atlas.naturalWidth / 4;
        const size = Math.min(144, area.height * .58);
        const x = actor.left - area.left + (actor.width - size) / 2;
        const y = actor.top - area.top + (actor.height - size) / 2;
        return new Promise(resolve => {
          let start;
          function paint(now) {
            start ??= now;
            const frame = Math.floor((now - start) / 140);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (frame >= 4) { resolve(); return; }
            ctx.drawImage(atlas, frame * tile, row * tile, tile, tile, x, y, size, size);
            requestAnimationFrame(paint);
          }
          requestAnimationFrame(paint);
        });
      },
    };
  },
};
