import { BezierLine } from "../models/bezier.model";

export function getPath(line: BezierLine): string {
    const p = line.points;
    if (!p || p.length === 0) return '';

    let d = `M ${p[0].x} ${p[0].y}`;

    // Linear paths just move point to point
    if (line.type === 'linear') {
      for (let i = 1; i < p.length; i++) {
        d += ` L ${p[i].x} ${p[i].y}`;
      }
    } else {
      // ... your existing quadratic/cubic logic ...
      const step = line.type === 'quadratic' ? 2 : 3;
      for (let i = 1; i < p.length; i += step) {
        if (line.type === 'quadratic' && p[i + 1]) {
          d += ` Q ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y}`;
        } else if (line.type === 'cubic' && p[i + 2]) {
          d += ` C ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y} ${p[i + 2].x} ${p[i + 2].y}`;
        }
      }
    }

    // CHECK FOR CLOSURE
    const first = p[0];
    const last = p[p.length - 1];
    const isClosed =
      Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1;

    if (isClosed && p.length > 2) {
      d += ' Z'; // This turns the "line" into a "shape"
    }

    return d;
  }