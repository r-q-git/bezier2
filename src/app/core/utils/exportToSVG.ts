import { BezierLine } from '../models/bezier.model';
import { generateMultiLineSVGString } from './generateMultiLineSVGString';

export function exportToSVG(lines: BezierLine[]) {
  const svgContent = generateMultiLineSVGString(lines);
  if (!svgContent) return;

  const blob = new Blob([svgContent], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `bezier-export-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
//   this.toast.triggerToast('SVG Downloaded Successfully!');
}
