import { Component, OnInit } from '@angular/core';
import { BezierLine, Point } from '../core/models/bezier.model';
import { LineService } from '../core/services/line.service';
import { getBounds } from '../core/utils/getBounds';
import { getSegments } from '../core/utils/getSegments';
import { getPath } from '../core/utils/getPath';
import { getDashArray } from '../core/utils/getDashArray';
import { getLineCap } from '../core/utils/getLineCap';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css'],
})
export class ContainerComponent {
  lines: BezierLine[] = [];
  activePointIndex: number | null = null;
  selectedLine: BezierLine | null = null;

  lastMouse: Point = { x: 0, y: 0 };
  draggedSegmentIndex: number | null = null;

  // hovered point variables :
  hoveredPointIndex: number | null = null;

  isReshaping = false;
  isMovingLine = false;
  isEndPoint(index: number, line: BezierLine): boolean {
    return index === 0 || index === line.points.length - 1;
  }

  constructor(private lineService: LineService) {}

  ngOnInit() {
    this.lineService.lines$.subscribe((l) => (this.lines = l));
    this.lineService.selectedLine$.subscribe((l) => (this.selectedLine = l));
    this.lineService.hoveredpointIndex$.subscribe(
      (i) => (this.hoveredPointIndex = i),
    );
  }

  setHover(index: number | null) {
    this.lineService.hoveredPointIndex = index;
  }

  startMove(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();
    this.lineService.selectLine(line);
    this.lineService.isMovingLine = true;
    this.lineService.lastMouse = { x: event.clientX, y: event.clientY };
  }

  startPointDrag(event: MouseEvent, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.lineService.isMovingLine = false;
    this.lineService.isReshaping = false;
    this.lineService.activePointIndex = index;
  }

  deletePoint(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const line = this.selectedLine;
    if (!line || line.points.length <= 2) {
      // Delete via service
      this.lineService.lines = this.lineService.lines.filter(
        (l) => l.id !== line?.id,
      );
      this.lineService.selectedLine = null;
      return;
    }

    const p = line.points;
    if (line.type === 'linear') {
      p.splice(index, 1);
    } else if (line.type === 'quadratic') {
      if (index % 2 === 0) {
        const deleteCount = index === p.length - 1 ? 2 : 2;
        const startIdx = index === p.length - 1 ? index - 1 : index;
        p.splice(startIdx, deleteCount);
      }
    } else if (line.type === 'cubic') {
      if (index % 3 === 0) {
        if (index === 0) {
          p.splice(0, 3);
        } else if (index === p.length - 1) {
          p.splice(index - 2, 3);
        } else {
          p.splice(index - 1, 3);
        }
      }
    }

    this.lineService.activePointIndex = null;
    // Force reactivity update
    this.lineService.lines = [...this.lineService.lines];
  }

  getPath(line: BezierLine) {
    return getPath(line);
  }

  getDashArray(line: BezierLine) {
    return getDashArray(line);
  }

  getLineCap(line: BezierLine) {
    return getLineCap(line);
  }

  getSegments(line: BezierLine) {
    return getSegments(line);
  }
  getBounds(line: BezierLine) {
    return getBounds(line);
  }

  // Add these properties to your class
  private scalingLine: BezierLine | null = null;
  private scaleHandle: string = '';
  private initialBounds: any = null;
  private startMousePos: Point = { x: 0, y: 0 };
  private originalPoints: Point[] = [];

  // Add these methods
  startScale(event: MouseEvent, line: BezierLine, handle: string) {
    event.stopPropagation();
    event.preventDefault();

    this.scalingLine = line;
    this.scaleHandle = handle;
    this.startMousePos = { x: event.clientX, y: event.clientY };
    this.initialBounds = getBounds(line);

    // Store a deep copy of points to calculate scale relative to the start state
    this.originalPoints = JSON.parse(JSON.stringify(line.points));

    const onMouseMove = (moveEvent: MouseEvent) => this.handleScale(moveEvent);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.scalingLine = null;
      // Push final state to service for reactivity
      this.lineService.lines = [...this.lines];
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // PATH: src/app/container/container.component.ts

  private handleScale(event: MouseEvent) {
    if (!this.scalingLine || !this.initialBounds) return;

    const dx = event.clientX - this.startMousePos.x;
    const dy = event.clientY - this.startMousePos.y;

    const b = this.initialBounds;

    let scale = 1;
    let anchorX = 0;
    let anchorY = 0;

    // project movement onto diagonal
    let diagonalMove = 0;

    switch (this.scaleHandle) {
      case 'tl': // ↖
        anchorX = b.left + b.width;
        anchorY = b.top + b.height;
        diagonalMove = (-dx - dy) / 2;
        scale = (b.width + diagonalMove) / b.width;
        break;

      case 'tr': // ↗
        anchorX = b.left;
        anchorY = b.top + b.height;
        diagonalMove = (dx - dy) / 2;
        scale = (b.width + diagonalMove) / b.width;
        break;

      case 'br': // ↘
        anchorX = b.left;
        anchorY = b.top;
        diagonalMove = (dx + dy) / 2;
        scale = (b.width + diagonalMove) / b.width;
        break;

      case 'bl': // ↙
        anchorX = b.left + b.width;
        anchorY = b.top;
        diagonalMove = (-dx + dy) / 2;
        scale = (b.width + diagonalMove) / b.width;
        break;
    }

    const minScale = 0.05;
    scale = Math.max(scale, minScale);

    this.scalingLine.points = this.originalPoints.map((pt) => ({
      x: anchorX + (pt.x - anchorX) * scale,
      y: anchorY + (pt.y - anchorY) * scale,
    }));

    this.lineService.selectedLine = { ...this.scalingLine };
  }
}
