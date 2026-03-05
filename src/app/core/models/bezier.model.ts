export interface Point {
  x: number;
  y: number;
}

export interface BezierLine {
  id: string;
  type: 'linear' | 'quadratic' | 'cubic';
  points: Point[]; // Linear: 2, Quad: 3, Cubic: 4
  color: string;
  width: number;
  fill: string;
  locked: boolean;
  selected: boolean;
}
