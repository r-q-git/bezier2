import { Component } from '@angular/core';
import { Shape } from '../core/models/shape.model';
import { LineService } from '../core/services/line.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
})
export class AddComponent {
  showShapeMenu: boolean = false;
  customShapes: any = [];

  constructor(private lineService: LineService) {
    this.customShapes = this.lineService.customShapes;
  }
  addLine(type: 'linear' | 'quadratic' | 'cubic') {
    this.lineService.addLine(type); 
  }

  addShape(shape: any) {
    this.lineService.addShape(shape);
    this.showShapeMenu = false;
  }
}
