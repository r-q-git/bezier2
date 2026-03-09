import { Component } from '@angular/core';

interface ControlItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-controls-help',
  templateUrl: './controls-help.component.html',
  styleUrls: ['./controls-help.component.css'],
})
export class ControlsHelpComponent {
  visible = false;

  controls: ControlItem[] = [
    {
      title: 'Change Bezier Shape',
      description: 'Use the control points to change the shape of the Bezier.',
    },
    {
      title: 'Add Segment',
      description: 'Double click inside the boundary to add a segment.',
    },
    {
      title: 'Delete Segment',
      description: 'Right click on a vertex to delete the segment.',
    },
    {
      title: 'Unselect Bezier',
      description: 'Click anywhere on the canvas to unselect.',
    },
    {
      title: 'Differentiate Overlap Vertex',
      description: 'Hold Alt + Click to separate overlapping vertices.',
    },
  ];

  togglePanel() {
    this.visible = !this.visible;
  }

  close() {
    this.visible = false;
  }
}
