import { Component } from '@angular/core';
import { exportToSVG } from '../core/utils/exportToSVG';
import { parseSVG } from '../core/utils/parseSVG';
import { BezierLine } from '../core/models/bezier.model';
import { copySVGBase64 } from '../core/utils/copySVGBase64';
import { LineService } from '../core/services/line.service';
import { ProjectExportService } from '../core/services/project-export.service';

@Component({
  selector: 'app-add-to-project',
  templateUrl: './add-to-project.component.html',
  styleUrls: ['./add-to-project.component.css'],
})
export class AddToProjectComponent {
  lines: BezierLine[] = [];
  constructor(
    private lineService: LineService,
    private projectExportService: ProjectExportService,
  ) {}

  ngOnInit() {
    // Keep local array in sync with global state [cite: 9, 47]
    this.lineService.lines$.subscribe((lines) => (this.lines = lines));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;

      parseSVG(content, this.lines);
      this.lineService.lines = [...this.lines];
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  triggerUpload() {
    const fileInput = document.getElementById('svgUpload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  exportToSVG() {
    return exportToSVG(this.lines);
  }

  copySVGBase64() {
    return copySVGBase64(this.lines);
  }

  exportCurrentDrawing() {
    this.projectExportService.exportCurrentDrawing();
  }
}
