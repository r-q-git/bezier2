import { Component, ElementRef, HostListener } from '@angular/core';
import { BezierLine } from '../core/models/bezier.model';
import { LineService } from '../core/services/line.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent {
  selectedLine: BezierLine | null = null;
  linemenu: boolean = false;
  isColorPickerOpen = false;
  isFillColorPickerOpen = false;

  openColorPicker(input: HTMLInputElement) {
    this.isColorPickerOpen = true;
    input.click();
  }

  // fill color pickeer menu toggle :
  openFillColorPicker(input: HTMLInputElement) {
    this.isFillColorPickerOpen = true;
    input.click();
  }

  constructor(
    private lineService: LineService,
    private eRef: ElementRef,
  ) {}

  ngOnInit() {
    this.lineService.selectedLine$.subscribe((line) => {
      this.selectedLine = line;
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    // If the click is NOT inside this component's element
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeAllMenus();
    }
  }

  closeAllMenus() {
    this.linemenu = false;
    this.isColorPickerOpen = false;
    this.isFillColorPickerOpen = false;
  }

  duplicateLine(e: MouseEvent, line: BezierLine) {
    this.lineService.duplicateLine(e, line);
  }

  removeWholeLine(e: MouseEvent, id: string) {
    this.lineService.removeWholeLine(e, id);
  }
}
