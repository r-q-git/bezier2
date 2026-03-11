import { BezierLine } from "../models/bezier.model";

// this method is to show only the control points which are not on the line.
export function isAnchorPoint(index: number, line: BezierLine): boolean {
  if (line.type === 'linear') return true;

  if (line.type === 'quadratic') {
    // Start (0) and End (2) are on the line. Index 1 is the control point.
    return index === 0 || index === 2;
  }

  if (line.type === 'cubic') {
    // Start (0) and End (3) are on the line. Indices 1 and 2 are control points.
    return index === 0 || index === 3;
  }

  return true;
}
