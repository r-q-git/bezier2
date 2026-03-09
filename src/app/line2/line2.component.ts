import { Component, HostListener, ViewChild } from '@angular/core';
import data from '../../assets/shapes.json';
import { ToastComponent } from '../toast/toast.component';

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
  fillOpacity: number;
  rotation: number;
  selected: boolean;
  hovered?: boolean;
  locked?: boolean;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  linecap: 'straight' | 'square' | 'butt' | 'round';
}

@Component({
  selector: 'app-line-two',
  templateUrl: './line2.component.html',
  styleUrls: ['./line2.component.css'],
})
export class Line2Component {
  lines: BezierLine[] = [];
  selectedLine: BezierLine | null = null;

  // Interaction states
  isReshaping = false;
  isMovingLine = false;
  isRotating = false;
  activePointIndex: number | null = null;

  lastMouse: Point = { x: 0, y: 0 };
  draggedSegmentIndex: number | null = null;

  // hovered point variables :
  hoveredPointIndex: number | null = null;
  setHover(index: number | null) {
    this.hoveredPointIndex = index;
  }
  isEndPoint(index: number, line: BezierLine): boolean {
    return index === 0 || index === line.points.length - 1;
  }

  // Line width Menu toggle:
  linemenu: boolean = false;

  // color picker menu toggle :
  isColorPickerOpen = false;

  openColorPicker(input: HTMLInputElement) {
    this.isColorPickerOpen = true;
    input.click();
  }

  // fill color pickeer menu toggle :
  isFillColorPickerOpen = false;
  openFillColorPicker(input: HTMLInputElement) {
    this.isFillColorPickerOpen = true;
    input.click();
  }

  @ViewChild('toastComponent') toast!: ToastComponent;

  addLine(type: 'linear' | 'quadratic' | 'cubic') {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newLine: BezierLine = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      points: this.getDefaultPoints(type, centerX, centerY),
      color: '#ff9100',
      fill: 'transparent',
      width: 3,
      fillOpacity: 1,
      strokeStyle: 'solid',
      linecap: 'round',
      rotation: 0,
      selected: true,
    };

    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
  }

  // Shapes:
  showShapeMenu = false;
  customShapes = [...data];

  addShape(shape: any) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Clone points and shift them to center
    const newPoints = shape.points.map((p: Point) => ({
      x: p.x + centerX,
      y: p.y + centerY,
    }));

    const newLine: BezierLine = {
      id: Math.random().toString(36).substring(2, 9),
      type: shape.type,
      points: newPoints,
      color: '#ff9100',
      fill: '#f1f3f4',
      fillOpacity: 1,
      width: 2,
      strokeStyle: 'solid',
      linecap: 'round',
      rotation: 0,
      selected: true,
    };

    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
    this.showShapeMenu = false;
  }

  private getDefaultPoints(type: string, cx: number, cy: number): Point[] {
    const width = 400;
    const height = 200;
    const handleOffset = 60; // Distance to push control points away

    if (type === 'linear') {
      return [
        { x: cx - width / 2, y: cy },
        { x: cx + width / 2, y: cy },
      ];
    }

    if (type === 'quadratic') {
      // Quadratic: Mid-point is the control handle
      return [
        { x: cx - width / 2, y: cy + height / 2 }, // Start
        { x: cx, y: cy - height / 2 - handleOffset }, // Control Point (Pushed Upwards away from center)
        { x: cx + width / 2, y: cy + height / 2 }, // End
      ];
    }

    // Cubic: Indices 1 and 2 are control handles
    return [
      { x: cx - width / 2, y: cy + height / 2 }, // Start (Bottom Left)
      { x: cx - width / 2, y: cy - handleOffset }, // CP1 (Pushed Up away from Start)
      { x: cx + width / 2, y: cy + handleOffset }, // CP2 (Pushed Down away from End)
      { x: cx + width / 2, y: cy - height / 2 }, // End (Top Right)
    ];
  }

  // --- BOUNDING BOX CALCULATIONS ---
  getBounds(line: BezierLine) {
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

  rotationCenter: { x: number; y: number } | null = null;
  initialRotationAngle: number = 0;
  initialPointsForRotation: Point[] = [];

  // --- MOUSE HANDLERS ---
  // This function identifies which segment was clicked
  startPointDrag(event: MouseEvent, index: number) {
    event.stopPropagation(); // Stops the click from reaching the Bounding Box Div
    event.preventDefault(); // Prevents browser ghosting

    this.isMovingLine = false;
    this.isReshaping = false;

    this.activePointIndex = index;
  }

  startReshape(event: MouseEvent, line: BezierLine, segmentIndex: number) {
    event.stopPropagation();

    this.isMovingLine = false;
    this.activePointIndex = null;

    this.isReshaping = true;
    this.draggedSegmentIndex = segmentIndex;
  }

  startMove(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();

    this.selectLine(line);
    this.isMovingLine = true;
    this.lastMouse = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const line = this.selectedLine;
    if (!line || !line.points) return;

    // 2. ZOOM COMPENSATION:
    const worldDX = event.movementX;
    const worldDY = event.movementY;

    // 4. Calculate De-rotated Delta
    let localDX = worldDX;
    let localDY = worldDY;

    if (line.rotation !== 0) {
      const angleRad = -line.rotation * (Math.PI / 180);
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      localDX = worldDX * cos - worldDY * sin;
      localDY = worldDX * sin + worldDY * cos;
    }

    // 5. Point Dragging (Updated with Clamping)
    if (this.activePointIndex !== null) {
      const idx = this.activePointIndex;
      const p = line.points;
      const dragTarget = p[idx];
      if (!dragTarget) return;

      const oldX = dragTarget.x;
      const oldY = dragTarget.y;

      dragTarget.x = Math.max(
        0,
        Math.min(window.innerWidth, dragTarget.x + localDX),
      );
      dragTarget.y = Math.max(
        0,
        Math.min(window.innerHeight, dragTarget.y + localDY),
      );

      const actualDX = dragTarget.x - oldX;
      const actualDY = dragTarget.y - oldY;

      if (!event.altKey) {
        p.forEach((otherPt, i) => {
          if (i !== idx && this.isAnchorPoint(i, line)) {
            const isOverlapping =
              Math.abs(otherPt.x - oldX) < 1 && Math.abs(otherPt.y - oldY) < 1;
            if (isOverlapping) {
              otherPt.x = dragTarget.x;
              otherPt.y = dragTarget.y;
              this.moveAttachedHandles(line, i, actualDX, actualDY);
            }
          }
        });
      }
      this.moveAttachedHandles(line, idx, actualDX, actualDY);

      // checking here if the points are closed or not!
      const points = line.points;
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      // If the user just dragged either the first or last point to meet the other
      if (
        this.activePointIndex === 0 ||
        this.activePointIndex === points.length - 1
      ) {
        const distance = Math.sqrt(
          Math.pow(firstPoint.x - lastPoint.x, 2) +
            Math.pow(firstPoint.y - lastPoint.y, 2),
        );

        // If they are effectively on top of each other (within 1px)
        if (distance < 0.5) {
          this.toast.triggerToast('Path Closed!');
        }
      }
    }

    // 6. Reshape Logic (Updated with Clamping)
    else if (this.isReshaping && this.draggedSegmentIndex !== null) {
      const p = line.points;
      const i = this.draggedSegmentIndex;
      const flexibility = 0.8;

      if (line.type === 'cubic') {
        // Move handles but clamp them to screen
        [i + 1, i + 2].forEach((idx) => {
          p[idx].x = Math.max(
            0,
            Math.min(window.innerWidth, p[idx].x + localDX * flexibility),
          );
          p[idx].y = Math.max(
            0,
            Math.min(window.innerHeight, p[idx].y + localDY * flexibility),
          );
        });
      } else if (line.type === 'quadratic') {
        p[i + 1].x = Math.max(
          0,
          Math.min(window.innerWidth, p[i + 1].x + localDX),
        );
        p[i + 1].y = Math.max(
          0,
          Math.min(window.innerHeight, p[i + 1].y + localDY),
        );
      }
    }

    // 8. Move Whole Box (Already has boundary logic)
    else if (this.isMovingLine) {
      const canMoveX = line.points.every(
        (p) => p.x + worldDX >= 0 && p.x + worldDX <= window.innerWidth,
      );
      const canMoveY = line.points.every(
        (p) => p.y + worldDY >= 0 && p.y + worldDY <= window.innerHeight,
      );

      line.points.forEach((p) => {
        if (canMoveX) p.x += worldDX;
        if (canMoveY) p.y += worldDY;
      });
    }
  }

  private moveAttachedHandles(
    line: BezierLine,
    idx: number,
    dx: number,
    dy: number,
  ) {
    const p = line.points;
    if (!p) return;

    // If we are moving an ANCHOR point
    if (this.isAnchorPoint(idx, line)) {
      // Move the control point IMMEDIATELY following this anchor
      if (p[idx + 1] && !this.isAnchorPoint(idx + 1, line)) {
        p[idx + 1].x += dx;
        p[idx + 1].y += dy;
      }
      // Move the control point IMMEDIATELY preceding this anchor
      if (idx > 0 && p[idx - 1] && !this.isAnchorPoint(idx - 1, line)) {
        p[idx - 1].x += dx;
        p[idx - 1].y += dy;
      }
    }

    // CASE B: Dragging a Control Handle (idx 1, 2, 4, 5...)
    // We want to mirror the angle to the handle on the other side of the anchor.
    else {
      // this.mirrorHandle(line, idx);
    }
  }

  private mirrorHandle(line: BezierLine, handleIdx: number) {
    const p = line.points;
    let anchorIdx: number;
    let oppositeIdx: number;

    if ((handleIdx - 1) % 3 === 0) {
      anchorIdx = handleIdx - 1;
      oppositeIdx = handleIdx - 2;
    } else {
      anchorIdx = handleIdx + 1;
      oppositeIdx = handleIdx + 2;
    }

    const anchor = p[anchorIdx];
    const handle = p[handleIdx];
    const opposite = p[oppositeIdx];

    // If there is no opposite handle (e.g., at the very ends of the line), stop
    if (!anchor || !handle || !opposite) return;

    // Calculate distance of the opposite handle so we don't change its length
    const dxOpp = opposite.x - anchor.x;
    const dyOpp = opposite.y - anchor.y;
    const distOpp = Math.sqrt(dxOpp * dxOpp + dyOpp * dyOpp);

    // Calculate angle of the current handle being dragged
    const dxHandle = handle.x - anchor.x;
    const dyHandle = handle.y - anchor.y;
    const angleHandle = Math.atan2(dyHandle, dxHandle);

    // Set the opposite handle to the exact opposite angle (angle + PI)
    const mirroredAngle = angleHandle + Math.PI;

    opposite.x = anchor.x + Math.cos(mirroredAngle) * distOpp;
    opposite.y = anchor.y + Math.sin(mirroredAngle) * distOpp;
  }

  @HostListener('window:mouseup')
  stop() {
    this.isReshaping = false;
    this.isMovingLine = false;
    this.activePointIndex = null;
    this.isMovingLine = false;
  }
  extendLine(event: MouseEvent) {
    if (!this.selectedLine) return;

    const p = this.selectedLine.points;
    const last = p[p.length - 1];

    // Calculate mouse position relative to the canvas, not the div
    // This ensures the line extends exactly to your cursor
    const target = {
      x:
        event.clientX -
        (event.currentTarget as HTMLElement).getBoundingClientRect().left,
      y:
        event.clientY -
        (event.currentTarget as HTMLElement).getBoundingClientRect().top,
    };

    if (this.selectedLine.type === 'linear') {
      p.push(target);
    } else if (this.selectedLine.type === 'quadratic') {
      // Control point is placed at the midpoint to create a straight-ish start
      p.push(
        { x: (last.x + target.x) / 2, y: (last.y + target.y) / 2 },
        target,
      );
    } else if (this.selectedLine.type === 'cubic') {
      // Place handles 1/3 and 2/3 of the way to the new point
      // This gives each "end" its own local handle space immediately
      p.push(
        { x: last.x + (target.x - last.x) * 0.25, y: last.y }, // Local handle for the old end
        { x: target.x - (target.x - last.x) * 0.25, y: target.y }, // Local handle for the new end
        target,
      );
    }
  }

  selectLine(line: BezierLine) {
    this.lines.forEach((l) => (l.selected = false));
    line.selected = true;
    this.selectedLine = line;
  }

  getPath(line: BezierLine): string {
    const p = line.points;
    if (!p || p.length === 0) return '';

    let d = `M ${p[0].x} ${p[0].y}`;

    // Linear paths just move point to point
    if (line.type === 'linear') {
      for (let i = 1; i < p.length; i++) {
        d += ` L ${p[i].x} ${p[i].y}`;
      }
    } else {
      // ... your existing quadratic/cubic logic ...
      const step = line.type === 'quadratic' ? 2 : 3;
      for (let i = 1; i < p.length; i += step) {
        if (line.type === 'quadratic' && p[i + 1]) {
          d += ` Q ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y}`;
        } else if (line.type === 'cubic' && p[i + 2]) {
          d += ` C ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y} ${p[i + 2].x} ${p[i + 2].y}`;
        }
      }
    }

    // CHECK FOR CLOSURE
    const first = p[0];
    const last = p[p.length - 1];
    const isClosed =
      Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1;

    if (isClosed && p.length > 2) {
      d += ' Z'; // This turns the "line" into a "shape"
    }

    return d;
  }

  getSegments(line: BezierLine): { d: string; index: number }[] {
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

  // this method is to show only the control points which are not on the line.
  isAnchorPoint(index: number, line: BezierLine): boolean {
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

  deselectAll() {
    // Prevent deselecting if we are actively interacting with a point/line
    if (
      this.activePointIndex !== null ||
      this.isMovingLine ||
      this.isReshaping
    ) {
      return;
    }
    this.lines.forEach((l) => (l.selected = false));
    this.selectedLine = null;
  }

  deletePoint(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const line = this.selectedLine;
    if (!line || line.points.length <= 2) {
      // Optional: Delete the whole line if only 2 points remain
      this.lines = this.lines.filter((l) => l.id !== line?.id);
      this.selectedLine = null;
      return;
    }

    const p = line.points;

    if (line.type === 'linear') {
      p.splice(index, 1);
    } else if (line.type === 'quadratic') {
      // If it's an anchor, remove it and the adjacent control point
      if (index % 2 === 0) {
        const deleteCount = index === p.length - 1 ? 2 : 2;
        const startIdx = index === p.length - 1 ? index - 1 : index;
        p.splice(startIdx, deleteCount);
      }
    } else if (line.type === 'cubic') {
      // If it's an anchor, remove it and the 2 adjacent control points
      if (index % 3 === 0) {
        if (index === 0) {
          p.splice(0, 3); // Remove start anchor + 2 CPs
        } else if (index === p.length - 1) {
          p.splice(index - 2, 3); // Remove end anchor + 2 CPs
        } else {
          p.splice(index - 1, 3); // Remove middle anchor + neighbors
        }
      }
    }

    // Deselect point interaction
    this.activePointIndex = null;
  }

  removeWholeLine(event: MouseEvent, lineId: string) {
    event.stopPropagation();
    event.preventDefault();

    // FIX: Kill all active states immediately
    this.isMovingLine = false;
    this.activePointIndex = null;

    // Perform deletion
    this.lines = this.lines.filter((l) => l.id !== lineId);

    // Clear the selection reference
    if (this.selectedLine?.id === lineId) {
      this.selectedLine = null;
    }
  }

  toggleLock(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();
    line.locked = !line.locked;

    // If we lock it, we should stop any active dragging immediately
    if (line.locked) {
      this.stop();
    }
  }

  getDashArray(line: BezierLine): string {
    switch (line.strokeStyle) {
      case 'dashed':
        return `${line.width * 3}, ${line.width * 2}`;
      case 'dotted':
        return `${0}, ${line.width * 2.5}`;
      default:
        return 'none';
    }
  }

  getLineCap(line: BezierLine): string {
    switch (line.linecap) {
      case 'butt':
        return `butt`;
      case 'round':
        return `round`;
      case 'straight':
        return `straight`;
      case 'square':
        return `square`;
      default:
        return 'none';
    }
  }

  duplicateLine(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();

    // 1. Create a deep copy of the points (so they don't share memory)
    // We offset by 20px so it's obvious a new shape appeared
    const clonedPoints = line.points.map((p) => ({
      x: p.x + 20,
      y: p.y + 20,
    }));

    // 2. Create the new line object with a fresh ID
    const newLine: BezierLine = {
      ...line,
      id: Math.random().toString(36).substring(2, 9),
      points: clonedPoints,
      selected: true, // Auto-select the new copy
    };

    // 3. Clear existing selection and push the new line
    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
  }

  // File Handling :
  // 3. COPY BASE64 STRING
  // Helper to clean and prepare SVG for export
  // 1. Core Logic to Clean and Prepare the SVG
  // 1. Prepare the SVG String

  // 2. Updated Download Function
  /**
   * Generates a complete SVG string containing all lines currently on the screen.
   */
  private generateMultiLineSVGString(): string {
    // 1. Calculate the total bounding box for all lines to set the SVG viewbox
    if (this.lines.length === 0) return '';

    // 2. Create the opening SVG tag with the required namespace
    // We use window dimensions for the viewbox to ensure everything is captured
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${window.innerWidth}" height="${window.innerHeight}" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}">`;

    // 3. Loop through every line in your data array
    this.lines.forEach((line) => {
      const pathData = this.getPath(line); // Uses your existing logic [cite: 382]
      const dashArray = this.getDashArray(line); // Uses your dash logic [cite: 273]
      const lineCap = this.getLineCap(line); // Uses your cap logic [cite: 275]

      // Determine fill: linear lines usually shouldn't have a fill
      const fill = line.type === 'linear' ? 'none' : line.fill;

      // Build the path element with all current properties
      // We include a transform for the rotation property
      const bounds = this.getBounds(line);
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

  /**
   * Downloads all lines as a single .svg file
   */
  exportToSVG() {
    const svgContent = this.generateMultiLineSVGString();
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
    this.toast.triggerToast('SVG Downloaded Successfully!');
  }

  /**
   * Copies the entire multi-line SVG as a Base64 string
   */
  copySVGBase64() {
    const svgContent = this.generateMultiLineSVGString();
    if (!svgContent) return;

    // Convert string to Base64
    const base64 = btoa(unescape(encodeURIComponent(svgContent)));
    const base64String = `data:image/svg+xml;base64,${base64}`;

    navigator.clipboard.writeText(base64String).then(() => {
      this.toast.triggerToast('Base64 Copied to Clipboard!');
    });
  }

  // 2. UPLOAD SVG
  triggerUpload() {
    const fileInput = document.getElementById('svgUpload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.parseSVG(content);
      // Reset input so the same file can be uploaded again if needed
      event.target.value = '';
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

      this.lines.push({
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
}
