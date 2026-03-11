import { BezierLine } from '../models/bezier.model';
import { isAnchorPoint } from './isAnchorPoint';

export function moveAttachedHandles(
  line: BezierLine,
  idx: number,
  dx: number,
  dy: number,
) {
  const p = line.points;
  if (!p) return;

  // If we are moving an ANCHOR point
  if (isAnchorPoint(idx, line)) {
    // Move the control point IMMEDIATELY following this anchor
    if (p[idx + 1] && !isAnchorPoint(idx + 1, line)) {
      p[idx + 1].x += dx;
      p[idx + 1].y += dy;
    }
    // Move the control point IMMEDIATELY preceding this anchor
    if (idx > 0 && p[idx - 1] && !isAnchorPoint(idx - 1, line)) {
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

export function mirrorHandle(line: BezierLine, handleIdx: number) {
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
