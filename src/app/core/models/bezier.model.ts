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
