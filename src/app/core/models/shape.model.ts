export interface Shape {
  name: string;
  type: 'linear' | 'quadratic' | 'cubic';
  points: {
    x: number;
    y: number;
  }[];
}
