import { BezierLine } from '../models/bezier.model';
import { generateMultiLineSVGString } from './generateMultiLineSVGString';

/**
 * Copies the entire multi-line SVG as a Base64 string
 */
export function copySVGBase64(
  lines: BezierLine[]
): string {
  const svgContent = generateMultiLineSVGString(lines);
  if (!svgContent) return '';

  // Convert string to Base64
  const base64 = btoa(unescape(encodeURIComponent(svgContent)));
  const base64String = `data:image/svg+xml;base64,${base64}`;

  navigator.clipboard.writeText(base64String).then(() => {
    //   this.toast.triggerToast('Base64 Copied to Clipboard!');
  });

  return base64String;
}
