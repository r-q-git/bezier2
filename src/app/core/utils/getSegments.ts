import { BezierLine } from "../models/bezier.model";

 export function getSegments(line: BezierLine): { d: string; index: number }[] {
    const segments = [];
    const p = line.points;
    // Step is 2 for Quadratic (P0-P1-P2), 3 for Cubic (P0-P1-P2-P3)
    const step = line.type === 'quadratic' ? 2 : line.type === 'cubic' ? 3 : 1;

    for (let i = 0; i <= p.length - (step + 1); i += step) {
      let d = `M ${p[i].x} ${p[i].y}`;
      if (line.type === 'linear') {
        d += ` L ${p[i + 1].x} ${p[i + 1].y}`;
      } else if (line.type === 'quadratic') {
        d += ` Q ${p[i + 1].x} ${p[i + 1].y} ${p[i + 2].x} ${p[i + 2].y}`;
      } else if (line.type === 'cubic') {
        d += ` C ${p[i + 1].x} ${p[i + 1].y} ${p[i + 2].x} ${p[i + 2].y} ${p[i + 3].x} ${p[i + 3].y}`;
      }
      segments.push({ d, index: i });
    }
    return segments;
  }