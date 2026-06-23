const canvas = document.getElementById("curve-canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const curve = new BezierCurve();
let dragging = null; // { node, part: 'anchor'|'in'|'out' }

const PADDING = 20;

function toScreen(t, v) {
  return {
    x: PADDING + t * (canvas.width - PADDING * 2),
    y: canvas.height - PADDING - v * (canvas.height - PADDING * 2),
  };
}

function toCurveSpace(x, y) {
  return {
    t: (x - PADDING) / (canvas.width - PADDING * 2),
    v: (canvas.height - PADDING - y) / (canvas.height - PADDING * 2),
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = "#222";
  for (let i = 0; i <= 4; i++) {
    const x = PADDING + (i / 4) * (canvas.width - PADDING * 2);
    const y = PADDING + (i / 4) * (canvas.height - PADDING * 2);
    ctx.beginPath();
    ctx.moveTo(x, PADDING);
    ctx.lineTo(x, canvas.height - PADDING);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(canvas.width - PADDING, y);
    ctx.stroke();
  }

  // curve
  const samples = curve.sample();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  samples.forEach((p, i) => {
    const s = toScreen(p.t, p.v);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();

  // handles + nodes
  curve.nodes.forEach((node) => {
    const anchor = toScreen(node.t, node.v);
    const hIn = toScreen(node.t + node.handleIn.dt, node.v + node.handleIn.dv);
    const hOut = toScreen(node.t + node.handleOut.dt, node.v + node.handleOut.dv);

    ctx.strokeStyle = "#3b82f6";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hIn.x, hIn.y);
    ctx.lineTo(anchor.x, anchor.y);
    ctx.lineTo(hOut.x, hOut.y);
    ctx.stroke();
    ctx.setLineDash([]);

    drawDot(hIn, "#3b82f6", 4);
    drawDot(hOut, "#3b82f6", 4);
    drawDot(anchor, "#f5d142", 5);
  });
}

function drawDot(p, color, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function hitTest(x, y) {
  const r = 8;
  for (const node of curve.nodes) {
    const anchor = toScreen(node.t, node.v);
    const hIn = toScreen(node.t + node.handleIn.dt, node.v + node.handleIn.dv);
    const hOut = toScreen(node.t + node.handleOut.dt, node.v + node.handleOut.dv);
    if (dist(x, y, anchor.x, anchor.y) < r) return { node, part: "anchor" };
    if (dist(x, y, hIn.x, hIn.y) < r) return { node, part: "in" };
    if (dist(x, y, hOut.x, hOut.y) < r) return { node, part: "out" };
  }
  return null;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dragging = hitTest(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cs = toCurveSpace(x, y);

  const { node, part } = dragging;
  if (part === "anchor") {
    node.t = clamp01(cs.t);
    node.v = clamp01(cs.v);
  } else if (part === "in") {
    node.handleIn.dt = cs.t - node.t;
    node.handleIn.dv = cs.v - node.v;
  } else if (part === "out") {
    node.handleOut.dt = cs.t - node.t;
    node.handleOut.dv = cs.v - node.v;
  }
  draw();
});

window.addEventListener("mouseup", () => {
  dragging = null;
});

canvas.addEventListener("dblclick", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const hit = hitTest(x, y);
  if (hit && hit.part === "anchor") {
    curve.removeNode(hit.node);
    draw();
  }
});

document.getElementById("btn-add-point").addEventListener("click", () => {
  curve.addNode(0.5, 0.5);
  draw();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  curve.reset();
  draw();
});

document.getElementById("btn-mock").addEventListener("click", async () => {
  const keyframes = await AEBridge.getSelectedPropertyKeyframes();
  statusEl.textContent = `Keyframes chargées: ${keyframes.length}`;
});

document.getElementById("btn-apply").addEventListener("click", async () => {
  await AEBridge.applyCurveToSelectedProperty(curve.sample());
  statusEl.textContent = "Courbe appliquée";
});

statusEl.textContent = AEBridge.runningInUXP
  ? "Connecté à After Effects (UXP)"
  : "Mode navigateur (pas d'AE détectée)";

draw();
