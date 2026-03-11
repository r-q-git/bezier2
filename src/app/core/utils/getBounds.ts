import { BezierLine } from '../models/bezier.model';

// --- BOUNDING BOX CALCULATIONS ---
export function getBounds(line: BezierLine) {
  const xs = line.points.map((p) => p.x);
  const ys = line.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const padding = 20;

  const left = minX - padding;
  const top = minY - padding;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
