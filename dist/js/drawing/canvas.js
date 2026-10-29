Craft.mountDrawing = (canvas, onChange) => {
  const ctx = canvas.getContext('2d');
  let strokes = [], current = null, width = 5;
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = GamePalette.tokens.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      ctx.lineWidth = stroke.width; ctx.beginPath();
      stroke.points.forEach(([x,y], index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      if (stroke.points.length === 1) ctx.lineTo(stroke.points[0][0] + .1, stroke.points[0][1]);
      ctx.stroke();
    }
    onChange(strokes.length, strokes.reduce((sum,s) => sum + s.points.length, 0));
  }
  function position(event) { const r = canvas.getBoundingClientRect(); return [(event.clientX-r.left)*canvas.width/r.width,(event.clientY-r.top)*canvas.height/r.height]; }
  function end() { current = null; }
  canvas.addEventListener('pointerdown', event => {
    if (current || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    current = { width, points:[position(event)], pointerId:event.pointerId }; strokes.push(current); redraw();
  });
  canvas.addEventListener('pointermove', event => { if (!current || event.pointerId !== current.pointerId) return; current.points.push(position(event)); redraw(); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => canvas.addEventListener(name, event => { if (current?.pointerId === event.pointerId) end(); }));
  return {
    setWidth(value) { width = Number(value); },
    clear() { end(); strokes = []; redraw(); },
    undo() { end(); strokes.pop(); redraw(); },
    replace(next) { end(); strokes = next; redraw(); }
  };
};
