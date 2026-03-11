import { Point } from "../models/bezier.model";

export function getDefaultPoints(type: string, cx: number, cy: number): Point[] {
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