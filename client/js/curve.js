// Multi-keyframe bezier curve model: a list of nodes, each with
// an anchor point and two handles (in/out), independent of any
// single AE keyframe pair. Time and value are normalized 0..1.
class BezierCurve {
  constructor() {
    this.nodes = [
      this._node(0, 0),
      this._node(1, 1),
    ];
  }

  _node(t, v) {
    return {
      t, v,
      handleIn: { dt: -0.1, dv: 0 },
      handleOut: { dt: 0.1, dv: 0 },
    };
  }

  addNode(t, v) {
    const node = this._node(t, v);
    this.nodes.push(node);
    this.nodes.sort((a, b) => a.t - b.t);
    return node;
  }

  removeNode(node) {
    if (this.nodes.length <= 2) return;
    const i = this.nodes.indexOf(node);
    if (i !== -1) this.nodes.splice(i, 1);
  }

  reset() {
    this.nodes = [this._node(0, 0), this._node(1, 1)];
  }

  // Sample the full curve as a flat array of {t, v} points for drawing.
  sample(stepsPerSegment = 32) {
    const points = [];
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i];
      const b = this.nodes[i + 1];
      const p0 = { t: a.t, v: a.v };
      const p1 = { t: a.t + a.handleOut.dt, v: a.v + a.handleOut.dv };
      const p2 = { t: b.t + b.handleIn.dt, v: b.v + b.handleIn.dv };
      const p3 = { t: b.t, v: b.v };
      for (let s = 0; s <= stepsPerSegment; s++) {
        const u = s / stepsPerSegment;
        points.push(cubicBezier(p0, p1, p2, p3, u));
      }
    }
    return points;
  }
}

function cubicBezier(p0, p1, p2, p3, u) {
  const mu = 1 - u;
  const t =
    mu * mu * mu * p0.t +
    3 * mu * mu * u * p1.t +
    3 * mu * u * u * p2.t +
    u * u * u * p3.t;
  const v =
    mu * mu * mu * p0.v +
    3 * mu * mu * u * p1.v +
    3 * mu * u * u * p2.v +
    u * u * u * p3.v;
  return { t, v };
}
