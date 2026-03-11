import { BezierLine } from '../models/bezier.model';

export function getLineCap(line: BezierLine): string {
  // Default to 'butt' if nothing is selected, as 'none' is invalid for linecap
  if (!line.linecap) return 'butt';

  switch (line.linecap) {
    case 'round':
      return 'round';
    case 'square':
      return 'square';
    case 'butt':
    case 'straight': // Mapping your custom 'straight' to the SVG 'butt'
      return 'butt';
    default:
      return 'butt';
  }
}
