import { Component, HostListener, ViewChild } from '@angular/core';
import { ToastComponent } from '../toast/toast.component';
import { isAnchorPoint } from '../core/utils/isAnchorPoint';
import { moveAttachedHandles } from '../core/utils/moveAttachedHandles';
import { LineService } from '../core/services/line.service';

@Component({
  selector: 'main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent {
  @ViewChild('toastComponent') toast!: ToastComponent;

  // No local state variables here anymore!
  // We use the service as the single source of truth.
  constructor(public lineService: LineService) {}

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const line = this.lineService.selectedLine;
    if (!line || !line.points) return;

    // Zoom/Movement delta calculation
    const worldDX = event.movementX;
    const worldDY = event.movementY;

    let localDX = worldDX;
    let localDY = worldDY;

    // Handle Rotation math
    if (line.rotation !== 0) {
      const angleRad = -line.rotation * (Math.PI / 180);
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      localDX = worldDX * cos - worldDY * sin;
      localDY = worldDX * sin + worldDY * cos;
    }

    // 1. POINT DRAGGING (Using Service Getter)
    if (this.lineService.activePointIndex !== null) {
      const idx = this.lineService.activePointIndex;
      const p = line.points;
      const dragTarget = p[idx];
      if (!dragTarget) return;

      const oldX = dragTarget.x;
      const oldY = dragTarget.y;

      // Clamping to viewport
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

      // Snapping/Attached handles logic
      if (!event.altKey) {
        p.forEach((otherPt, i) => {
          if (i !== idx && isAnchorPoint(i, line)) {
            const isOverlapping =
              Math.abs(otherPt.x - oldX) < 1 && Math.abs(otherPt.y - oldY) < 1;
            if (isOverlapping) {
              otherPt.x = dragTarget.x;
              otherPt.y = dragTarget.y;
              moveAttachedHandles(line, i, actualDX, actualDY);
            }
          }
        });
      }
      moveAttachedHandles(line, idx, actualDX, actualDY);

      // Path closure check (Toast)
      const firstPoint = p[0];
      const lastPoint = p[p.length - 1];
      if (idx === 0 || idx === p.length - 1) {
        const distance = Math.sqrt(
          Math.pow(firstPoint.x - lastPoint.x, 2) +
            Math.pow(firstPoint.y - lastPoint.y, 2),
        );
        if (distance < 0.5) {
          this.toast.triggerToast('Path Closed!');
        }
      }

      // Update the service to broadcast the change
      this.lineService.selectedLine = line;
    }

    // 2. RESHAPE LOGIC (Using Service Getters)
    else if (
      this.lineService.isReshaping &&
      this.lineService.draggedSegmentIndex !== null
    ) {
      const p = line.points;
      const i = this.lineService.draggedSegmentIndex;
      const flexibility = 0.8;

      if (line.type === 'cubic') {
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
      this.lineService.selectedLine = line;
    }

    // 3. MOVE WHOLE BOX (Using Service Getter and lastMouse for precision)
    else if (this.lineService.isMovingLine && this.lineService.lastMouse) {
      const dx = event.clientX - this.lineService.lastMouse.x;
      const dy = event.clientY - this.lineService.lastMouse.y;

      const canMoveX = line.points.every(
        (p) => p.x + dx >= 0 && p.x + dx <= window.innerWidth,
      );
      const canMoveY = line.points.every(
        (p) => p.y + dy >= 0 && p.y + dy <= window.innerHeight,
      );

      line.points.forEach((p) => {
        if (canMoveX) p.x += dx;
        if (canMoveY) p.y += dy;
      });

      this.lineService.lastMouse = { x: event.clientX, y: event.clientY };
      this.lineService.selectedLine = line;
    }
  }

  @HostListener('window:mouseup')
  stop() {
    this.lineService.isReshaping = false;
    this.lineService.isMovingLine = false;
    this.lineService.activePointIndex = null;
    this.lineService.lastMouse = null;
  }

  extendLine(event: MouseEvent) {
    this.lineService.extendLine(event);
  }

  deselectAll() {
    if (
      this.lineService.activePointIndex !== null ||
      this.lineService.isMovingLine ||
      this.lineService.isReshaping
    ) {
      return;
    }

    const currentLines = this.lineService.lines;
    currentLines.forEach((l) => (l.selected = false));
    this.lineService.lines = [...currentLines];
    this.lineService.selectedLine = null;
  }
}
