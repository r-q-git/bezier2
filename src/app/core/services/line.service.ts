import { Injectable } from '@angular/core';
import { getDefaultPoints } from '../utils/getDefaultPoints';
import { BezierLine, Point } from '../models/bezier.model';
import data from '../../../assets/shapes.json';
import { BehaviorSubject } from 'rxjs';
import { Shape } from '../models/shape.model';

@Injectable({
  providedIn: 'root',
})
export class LineService {
  private _lines = new BehaviorSubject<BezierLine[]>([]);
  lines$ = this._lines.asObservable();

  private _selectedLine = new BehaviorSubject<BezierLine | null>(null);
  selectedLine$ = this._selectedLine.asObservable();

  private _isMovingLine = new BehaviorSubject<boolean>(false);
  isMovingLine$ = this._isMovingLine.asObservable();

  private _isReshaping = new BehaviorSubject<boolean>(false);
  isReshaping$ = this._isReshaping.asObservable();

  private _activePointIndex = new BehaviorSubject<number | null>(null);
  activePointIndex$ = this._activePointIndex.asObservable();

  private _lastMouse = new BehaviorSubject<{ x: number; y: number } | null>(
    null,
  );
  lastMouse$ = this._lastMouse.asObservable();

  private _draggedSegmentIndex = new BehaviorSubject<number | null>(null);
  draggedSegmentIndex$ = this._draggedSegmentIndex.asObservable();

  private _hoveredPointIndex = new BehaviorSubject<number | null>(null);
  hoveredpointIndex$ = this._hoveredPointIndex.asObservable();

  // Shapes:
  // showShapeMenu = false;
  customShapes = [...data];

  get lines(): BezierLine[] {
    return this._lines.value;
  }

  set lines(value: BezierLine[]) {
    this._lines.next(value);
  }

  get selectedLine(): BezierLine | null {
    return this._selectedLine.value;
  }

  set selectedLine(value: BezierLine | null) {
    this._selectedLine.next(value);
  }

  get isMovingLine(): boolean {
    return this._isMovingLine.value;
  }
  set isMovingLine(value: boolean) {
    this._isMovingLine.next(value);
  }

  get isReshaping(): boolean {
    return this._isReshaping.value;
  }
  set isReshaping(value: boolean) {
    this._isReshaping.next(value);
  }

  get activePointIndex(): number | null {
    return this._activePointIndex.value;
  }
  set activePointIndex(value: number | null) {
    this._activePointIndex.next(value);
  }

  get draggedSegmentIndex(): number | null {
    return this._draggedSegmentIndex.value;
  }
  set draggedSegmentIndex(value: number | null) {
    this._draggedSegmentIndex.next(value);
  }

  get hoveredPointIndex(): number | null {
    return this._hoveredPointIndex.value;
  }

  set hoveredPointIndex(index: number | null) {
    this._hoveredPointIndex.next(index);
  }

  get lastMouse(): { x: number; y: number } | null {
    return this._lastMouse.value;
  }
  set lastMouse(value: { x: number; y: number } | null) {
    this._lastMouse.next(value);
  }

  constructor() {}

  selectLine(line: BezierLine) {
    this.lines.forEach((l) => (l.selected = false));
    line.selected = true;
    this.selectedLine = line;
  }

  addLine(type: 'linear' | 'quadratic' | 'cubic') {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newLine: BezierLine = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      points: getDefaultPoints(type, centerX, centerY),
      color: '#ff9100',
      fill: 'transparent',
      width: 3,
      fillOpacity: 1,
      strokeStyle: 'solid',
      linecap: 'butt',
      rotation: 0,
      selected: true,
    };

    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
  }

  addShape(shape: Shape) {
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
      linecap: 'butt',
      rotation: 0,
      selected: true,
    };

    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
    // this.showShapeMenu = false;
  }

  duplicateLine(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();
    const clonedPoints = line.points.map((p) => ({
      x: p.x + 20,
      y: p.y + 20,
    }));
    const newLine: BezierLine = {
      ...line,
      id: Math.random().toString(36).substring(2, 9),
      points: clonedPoints,
      selected: true,
    };
    this.lines.forEach((l) => (l.selected = false));
    this.lines.push(newLine);
    this.selectedLine = newLine;
  }

  removeWholeLine(event: MouseEvent, lineId: string) {
    event.stopPropagation();
    event.preventDefault();

    // FIX: Kill all active states immediately
    this._isMovingLine.next(false);
    this._activePointIndex.next(null);

    // Perform deletion
    this.lines = this.lines.filter((l) => l.id !== lineId);

    // Clear the selection reference
    if (this.selectedLine?.id === lineId) {
      this.selectedLine = null;
    }
  }

  isEndPoint(index: number, line: BezierLine): boolean {
    return index === 0 || index === line.points.length - 1;
  }

  toggleLock(event: MouseEvent, line: BezierLine) {
    event.stopPropagation();
    event.preventDefault();
    line.locked = !line.locked;

    // If we lock it, we should stop any active dragging immediately
    if (line.locked) {
      this._isReshaping.next(false);
      this._isMovingLine.next(false);
      this._activePointIndex.next(null);
      this._isMovingLine.next(false);
    }
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
}
