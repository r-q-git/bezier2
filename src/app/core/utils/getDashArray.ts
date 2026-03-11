import { BezierLine } from '../models/bezier.model';

export function getDashArray(line: BezierLine): string {
  // If no style is provided or it's solid, return 'none'
  if (!line.strokeStyle || line.strokeStyle === 'solid') {
    return 'none';
  }

  switch (line.strokeStyle) {
    case 'dashed':
      // Standard dash: 3x width for the dash, 2x for the gap
      return `${line.width * 3}, ${line.width * 2}`;
    case 'dotted':
      // For dots to look good, we use 0 length dashes with a gap
      // Note: This works best when linecap is 'round'
      return `0, ${line.width * 2}`;
    default:
      return 'none';
  }
}
