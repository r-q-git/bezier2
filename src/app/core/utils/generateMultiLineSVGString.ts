import { BezierLine } from '../models/bezier.model';
import { getBounds } from './getBounds';
import { getDashArray } from './getDashArray';
import { getLineCap } from './getLineCap';
import { getPath } from './getPath';

export function getProjectBounds(lines: BezierLine[]): {
  height: number;
  width: number;
} {
  let width = 0;
  let height = 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  lines.forEach((line) => {
    line.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });

  // Add a small padding (e.g., 20px) so the lines aren't touching the very edge
  const padding = 200;

  width = maxX - minX + padding * 2;
  height = maxY - minY + padding * 2;

  console.log(width);
  console.log(height);
  

  return { height, width };
}

export function generateMultiLineSVGString(lines: BezierLine[]): string {
  // 1. Calculate the total bounding box for all lines to set the SVG viewbox
  if (lines.length === 0) return '';
  let obj = getProjectBounds(lines);

  // 2. Create the opening SVG tag with the required namespace
  // We use window dimensions for the viewbox to ensure everything is captured
  let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${obj.width}" height="${obj.height}" viewBox="0 0 ${obj.width} ${obj.height}">`;

  // 3. Loop through every line in your data array
  lines.forEach((line) => {
    const pathData = getPath(line); // Uses your existing logic [cite: 382]

    const dashArray = getDashArray(line); // Uses your dash logic [cite: 273]
    const lineCap = getLineCap(line); // Uses your cap logic [cite: 275]

    // Determine fill: linear lines usually shouldn't have a fill
    const fill = line.type === 'linear' ? 'none' : line.fill;

    // Build the path element with all current properties
    // We include a transform for the rotation property
    const bounds = getBounds(line);
    const transform = `rotate(${line.rotation}, ${bounds.centerX}, ${bounds.centerY})`;

    svgString += `
      <path 
        d="${pathData}" 
        stroke="${line.color}" 
        stroke-width="${line.width}" 
        fill="${fill}" 
        fill-opacity="${line.fillOpacity}"
        stroke-dasharray="${dashArray}"
        stroke-linecap="${lineCap}"
        transform="${transform}"
      />`;
  });

  svgString += `</svg>`;
  return svgString;
}
