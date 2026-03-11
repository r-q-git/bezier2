import { BezierLine, Point } from "../models/bezier.model";

export function parseSVG(xmlString: string, lines : BezierLine[]) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'image/svg+xml');
    const paths = doc.querySelectorAll('path');

    paths.forEach((path) => {
      const d = path.getAttribute('d');
      if (!d) return;

      // regex to extract all numbers (including decimals and negatives)
      const coords = d.match(/-?\d+\.?\d*/g)?.map(Number) || [];
      const points: Point[] = [];

      for (let i = 0; i < coords.length; i += 2) {
        if (coords[i] !== undefined && coords[i + 1] !== undefined) {
          points.push({ x: coords[i], y: coords[i + 1] });
        }
      }

      if (points.length < 2) return;

      // Determine type based on command presence
      let type: 'linear' | 'quadratic' | 'cubic' = 'linear';
      if (d.includes('C')) type = 'cubic';
      else if (d.includes('Q')) type = 'quadratic';

      lines.push({
        id: Math.random().toString(36).substring(2, 9),
        type,
        points,
        color: path.getAttribute('stroke') || '#4f46e5',
        width: Number(path.getAttribute('stroke-width')) || 2,
        fill: path.getAttribute('fill') || 'transparent',
        fillOpacity: Number(path.getAttribute('fill-opacity')) || 1,
        rotation: 0,
        selected: false,
        locked: false,
        strokeStyle: 'solid',
        linecap: 'round',
      });
    });
  }