import { Component } from '@angular/core';

interface TooltipItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.css'],
})
export class TooltipComponent {
  tooltips: TooltipItem[] = [
    {
      title: 'Welcome',
      description: 'Check out the Controls here.',
    },
    {
      title: 'Change Bezier Shape',
      description: 'Click + Move to change the Shape of Bezier.',
    },
    {
      title: 'Add Segment',
      description: 'Double Click in the Boundary of the Shape to Add Segment.',
    },
    {
      title: 'Delete Segment',
      description: 'Right Click on the vertex to get the Segment Deleted.',
    },
    {
      title: 'UnSelect Bezier',
      description:
        'Click on the canvas any where to get the Bezier UnSelected.',
    },
    {
      title: 'Differentiate Overlap Vertex',
      description:
        'Click + Alt to get the top Vertex differentiate in case of Overlap.',
    },
  ];

  currentIndex = 0;
  visible = true;

  nextTooltip() {
    if (this.currentIndex < this.tooltips.length - 1) {
      this.currentIndex++;
    } else {
      this.close();
    }
  }

  close() {
    this.visible = false;
  }
}
