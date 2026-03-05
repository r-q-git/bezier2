import { Component } from '@angular/core';

export interface Point {
  x: number;
  y: number;
}
export interface BezierLine {
  id: string;
  type: 'linear' | 'quadratic' | 'cubic';
  points: Point[];
  color: string;
  width: number;
  fill: string;
  locked: boolean;
  selected: boolean;
  isClose: boolean;
}

export interface Group {
  id: string;
  lineIds: string[]; // References to BezierLine.id
  name: string;
}

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
})
export class LineComponent {
  lines: BezierLine[] = [];
  selectedLine: BezierLine | null = null;
  // This tracks all lines currently selected (manually or via a group)
  selectedLines: BezierLine[] = [];
  groups: Group[] = [];
  activePoint: { lineId: string; index: number } | null = null;

  isDraggingLine = false;
  isRotating = false;
  center = { x: 0, y: 0 };
  initialRotationAngle = 0;
  lastMousePos: Point = { x: 0, y: 0 };

  isDraggingSegment = false;
  draggedSegmentIndex = -1; // The index of the first point in the segment

  // Inside LineComponent

  isShiftPressed = false;
  mouseCanvasPos: Point = { x: 0, y: 0 };

  // Add window listeners for shift key in constructor or ngOnInit
  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') this.isShiftPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') this.isShiftPressed = false;
    });
  }

  addLine(type: 'linear' | 'quadratic' | 'cubic') {
    const newLine: BezierLine = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      points: this.getDefaultPoints(type),
      color: '#3b82f6',
      width: 2,
      fill: 'none',
      locked: false,
      selected: true,
      isClose: false, // Default to open
    };
    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
  }

  private getDefaultPoints(type: string): Point[] {
    const base = { x: 100, y: 100 };
    if (type === 'linear')
      return [
        { x: base.x, y: base.y },
        { x: base.x + 100, y: base.y },
      ];
    if (type === 'quadratic')
      return [
        { x: base.x, y: base.y + 100 },
        { x: base.x + 50, y: base.y },
        { x: base.x + 100, y: base.y + 100 },
      ];
    return [
      { x: base.x, y: base.y + 100 },
      { x: base.x + 20, y: base.y },
      { x: base.x + 80, y: base.y },
      { x: base.x + 100, y: base.y + 100 },
    ];
  }

  selectLine(line: BezierLine, event: MouseEvent) {
    event.stopPropagation();

    this.lines.forEach((l) => (l.selected = false));

    line.selected = true;
    this.selectedLines = [line];
    this.selectedLine = line;
  }

  deselectAll(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.selectedLine = null;
      this.selectedLines = []; // Clear the multi-select array
      this.lines.forEach((l) => (l.selected = false));
    }
  }

  startLineDrag(event: MouseEvent, line: BezierLine) {
    if (line.locked) return;
    event.stopPropagation();

    // SHIFT + CLICK → Convert Type
    if (this.isShiftPressed) {
      this.convertLineType(line);
      return;
    }

    this.isDraggingLine = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  convertLineType(line: BezierLine) {
    if (line.type === 'linear') {
      const [p1, p2] = line.points;

      line.type = 'quadratic';
      line.points = [
        p1,
        { x: (p1.x + p2.x) / 2, y: p1.y - 50 }, // auto control
        p2,
      ];
    } else if (line.type === 'quadratic') {
      const [p1, cp, p2] = line.points;

      line.type = 'cubic';
      line.points = [
        p1,
        { x: cp.x - 20, y: cp.y },
        { x: cp.x + 20, y: cp.y },
        p2,
      ];
    }
  }

  startRotate(event: MouseEvent, line: BezierLine) {
    if (line.locked) return;
    event.stopPropagation();
    this.isRotating = true;
    const bounds = this.getBoundsData(line);
    this.center = {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2,
    };
    this.initialRotationAngle = Math.atan2(event.clientY, event.clientX);
  }

  onMouseMove(event: MouseEvent) {
    if (this.selectedLines.length === 0) return;

    const svgRect = document
      .getElementById('canvas-svg')
      ?.getBoundingClientRect();
    if (!svgRect) return;

    if (svgRect) {
      this.mouseCanvasPos = {
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top,
      };
    }

    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    // Calculate mouse movement delta
    const deltaX = event.clientX - this.lastMousePos.x;
    const deltaY = event.clientY - this.lastMousePos.y;

    // A. DIRECT SEGMENT DRAGGING (Reshaping)
    // Triggered when isDraggingSegment is true (which we set on mousedown if Shift is held)
    if (this.isDraggingSegment && this.selectedLine) {
      const i = this.draggedSegmentIndex;
      const p = this.selectedLine.points;

      // If we are at the end of a closed loop
      const isClosingSegment = i >= p.length - 1 && this.selectedLine.isClose;

      if (this.selectedLine.type === 'quadratic') {
        const pStart = p[i];
        const pEnd = isClosingSegment ? p[0] : p[i + 2];
        const pControlIdx = i + 1;

        if (p[pControlIdx]) {
          p[pControlIdx] = {
            x: 2 * mouseX - 0.5 * pStart.x - 0.5 * pEnd.x,
            y: 2 * mouseY - 0.5 * pStart.y - 0.5 * pEnd.y,
          };
        }
      }
    }

    // B. INDIVIDUAL POINT DRAGGING
    else if (this.activePoint && this.selectedLine) {
      this.selectedLine.points[this.activePoint.index] = {
        x: mouseX,
        y: mouseY,
      };
    }

    // C. LINE OR GROUP DRAGGING (Moves all selected lines)
    else if (this.isDraggingLine) {
      this.selectedLines.forEach((line) => {
        line.points.forEach((p) => {
          p.x += deltaX;
          p.y += deltaY;
        });
      });

      // Update center dynamically during drag so rotation stays centered if user switches actions
      const bounds = this.getCombinedBoundsData();
      if (bounds) {
        this.center = { x: bounds.centerX, y: bounds.centerY };
      }
    }

    // D. ROTATION (Combined rotation around the group center)
    else if (this.isRotating) {
      const currentAngle = Math.atan2(
        event.clientY - (svgRect.top + this.center.y),
        event.clientX - (svgRect.left + this.center.x),
      );
      const angleDiff = currentAngle - this.initialRotationAngle;

      this.selectedLines.forEach((line) => {
        line.points.forEach((p) => {
          const relX = p.x - this.center.x;
          const relY = p.y - this.center.y;

          // Standard 2D Rotation Formula
          p.x =
            this.center.x +
            relX * Math.cos(angleDiff) -
            relY * Math.sin(angleDiff);
          p.y =
            this.center.y +
            relX * Math.sin(angleDiff) +
            relY * Math.cos(angleDiff);
        });
      });
      this.initialRotationAngle = currentAngle;
    }

    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }
  stopAll() {
    this.activePoint = null;
    this.isDraggingLine = false;
    this.isRotating = false;
    this.isDraggingSegment = false; // Reset the "Pull" state
    this.draggedSegmentIndex = -1;
  }

  // 1. Generate the visual SVG 'd' attribute
  getComplexPath(line: BezierLine): string {
    let d = this.getStandardPath(line); // Extract your current loop logic here
    const p = line.points;

    if (line.isClose && line.type !== 'linear') {
      const first = p[0];
      const last = p[p.length - 1];

      if (line.type === 'quadratic') {
        const control = {
          x: (first.x + last.x) / 2,
          y: (first.y + last.y) / 2 - 40,
        };

        d += ` Q ${control.x} ${control.y} ${first.x} ${first.y}`;
      } else if (line.type === 'cubic') {
        const cp1 = { x: last.x + 40, y: last.y };
        const cp2 = { x: first.x - 40, y: first.y };

        d += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${first.x} ${first.y}`;
      }
    }
    return d;
  }
  // 2. Create the invisible hit-areas for Shift+Drag reshaping
  getSegmentPaths(line: BezierLine): string[] {
    const p = line.points;
    const segments: string[] = [];
    const step = line.type === 'linear' ? 1 : line.type === 'quadratic' ? 2 : 3;

    for (let i = 0; i < p.length - 1; i += step) {
      segments.push(this.formatSegment(line, i, i + step));
    }

    if (line.isClose) {
      const last = p[p.length - 1];
      const first = p[0];

      if (line.type === 'quadratic') {
        // Use the last point in the array as the "hidden" control point for the closing segment
        // This requires the array to have one extra point when closed
        segments.push(
          `M ${last.x} ${last.y} Q ${last.x} ${last.y} ${first.x} ${first.y}`,
        );
      } else {
        segments.push(`M ${last.x} ${last.y} L ${first.x} ${first.y}`);
      }
    }
    return segments;
  }

  // Helper to generate the main string of the path
  private getStandardPath(line: BezierLine): string {
    const p = line.points;
    if (!p.length) return '';

    let d = `M ${p[0].x} ${p[0].y}`;
    const step = line.type === 'linear' ? 1 : line.type === 'quadratic' ? 2 : 3;

    // We loop until the second-to-last set of points
    for (let i = 1; i < p.length; i += step) {
      if (line.type === 'linear') {
        d += ` L ${p[i].x} ${p[i].y}`;
      } else if (line.type === 'quadratic' && p[i + 1]) {
        d += ` Q ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y}`;
      } else if (line.type === 'cubic' && p[i + 2]) {
        d += ` C ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y} ${p[i + 2].x} ${p[i + 2].y}`;
      }
    }
    return d;
  }

  getBounds(line: BezierLine) {
    const data = this.getBoundsData(line);
    const pad = 15;
    return {
      left: data.minX - pad + 'px',
      top: data.minY - pad + 'px',
      width: data.width + pad * 2 + 'px',
      height: data.height + pad * 2 + 'px',
    };
  }

  private formatSegment(line: BezierLine, start: number, end: number): string {
    const p = line.points;
    if (line.type === 'linear')
      return `M ${p[start].x} ${p[start].y} L ${p[end].x} ${p[end].y}`;
    if (line.type === 'quadratic')
      return `M ${p[start].x} ${p[start].y} Q ${p[start + 1].x} ${p[start + 1].y} ${p[end].x} ${p[end].y}`;
    return `M ${p[start].x} ${p[start].y} C ${p[start + 1].x} ${p[start + 1].y} ${p[start + 2].x} ${p[start + 2].y} ${p[end].x} ${p[end].y}`;
  }

  private getBoundsData(line: BezierLine) {
    const xs = line.points.map((p) => p.x);
    const ys = line.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      minX,
      minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
    };
  }

  onCanvasDoubleClick(event: MouseEvent) {
    if (!this.selectedLine) return;
    const svgRect = document
      .getElementById('canvas-svg')
      ?.getBoundingClientRect();
    if (!svgRect) return;
    this.extendLine(this.selectedLine, {
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top,
    });
  }

  extendLine(line: BezierLine, target: Point) {
    const last = line.points[line.points.length - 1];
    if (line.type === 'linear') line.points.push(target);
    else if (line.type === 'quadratic')
      line.points.push(
        { x: (last.x + target.x) / 2, y: (last.y + target.y) / 2 },
        target,
      );
    else if (line.type === 'cubic')
      line.points.push(
        { x: last.x + 30, y: last.y },
        { x: target.x - 30, y: target.y },
        target,
      );
  }

  // 1. Delete the selected line
  deleteSelectedLine() {
    if (this.selectedLine) {
      this.lines = this.lines.filter((l) => l.id !== this.selectedLine?.id);
      this.selectedLine = null;
    }
  }

  // 2. Quick toggle or clear fill
  clearFill() {
    if (this.selectedLine) {
      this.selectedLine.fill = 'none';
    }
  }

  // Add these to your LineComponent class

  // 1. DOWNLOAD SVG
  exportToSVG() {
    const svgElement = document
      .getElementById('canvas-svg')
      ?.cloneNode(true) as HTMLElement;
    if (!svgElement) return;

    // Clean up the clone: Remove hit areas and construction lines
    const hitAreas = svgElement.querySelectorAll('path[stroke="transparent"]');
    hitAreas.forEach((el) => el.remove());

    const constructionLines = svgElement.querySelectorAll(
      'path[stroke-dasharray]',
    );
    constructionLines.forEach((el) => el.remove());

    // Wrap in a proper SVG string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-drawing.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 2. UPLOAD SVG
  triggerUpload() {
    document.getElementById('svgUpload')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.parseSVG(content);
    };
    reader.readAsText(file);
  }

  private parseSVG(xmlString: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'image/svg+xml');
    const paths = doc.querySelectorAll('path');

    paths.forEach((path) => {
      const d = path.getAttribute('d');
      if (!d) return;

      // Basic parser for M, L, Q, C commands
      // Note: This is a simplified version for our app's structure
      const points: Point[] = [];
      const coords = d.match(/-?\d+\.?\d*/g)?.map(Number) || [];

      for (let i = 0; i < coords.length; i += 2) {
        points.push({ x: coords[i], y: coords[i + 1] });
      }

      let type: 'linear' | 'quadratic' | 'cubic' = 'linear';
      if (d.includes('C')) type = 'cubic';
      else if (d.includes('Q')) type = 'quadratic';

      this.lines.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        points,
        color: path.getAttribute('stroke') || '#000000',
        width: Number(path.getAttribute('stroke-width')) || 2,
        fill: path.getAttribute('fill') || 'none',
        locked: false,
        selected: false,
        isClose: false,
      });
    });
  }

  startSegmentDrag(event: MouseEvent, line: BezierLine, startIndex: number) {
    if (line.locked || line.type === 'linear') return; // Linear doesn't "pull"
    event.stopPropagation();
    this.isDraggingSegment = true;
    this.draggedSegmentIndex = startIndex;
    this.selectedLine = line;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  createGroup() {
    if (this.selectedLines.length < 2) return;

    const groupId = 'group-' + Math.random().toString(36).substring(2, 7);
    const newLineIds = this.selectedLines.map((l) => l.id);

    // Remove these lines from any existing groups first to avoid duplicates
    this.groups = this.groups.filter(
      (g) => !g.lineIds.some((id) => newLineIds.includes(id)),
    );

    this.groups.push({
      id: groupId,
      lineIds: newLineIds,
      name: `Group ${this.groups.length + 1}`,
    });

    console.log('Group Created:', groupId);
  }

  // Logic for Ungroup and Delete
  ungroup() {
    const selectedIds = this.selectedLines.map((l) => l.id);
    this.groups = this.groups.filter(
      (g) => !g.lineIds.some((id) => selectedIds.includes(id)),
    );
  }

  deleteSelected() {
    const selectedIds = this.selectedLines.map((l) => l.id);
    this.lines = this.lines.filter((l) => !selectedIds.includes(l.id));
    this.selectedLines = [];
    this.selectedLine = null;
  }

  // Updated Bounds logic to cover ALL selected lines
  getCombinedBounds() {
    if (this.selectedLines.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.selectedLines.forEach((line) => {
      line.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const pad = 15;
    return {
      left: minX - pad + 'px',
      top: minY - pad + 'px',
      width: maxX - minX + pad * 2 + 'px',
      height: maxY - minY + pad * 2 + 'px',
    };
  }

  // Helper to get raw numerical bounds for the entire selection
  getCombinedBoundsData() {
    if (this.selectedLines.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.selectedLines.forEach((line) => {
      line.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2,
    };
  }


  
}
