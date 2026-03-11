import { Injectable } from '@angular/core';
import { LineService } from './line.service';
import { QlIframeMessageService } from './QlIframeMessageService';
import { IframeMessageType } from '../models/iframeMessage.model';
import { copySVGBase64 } from '../utils/copySVGBase64';
import { BezierLine } from '../models/bezier.model';

@Injectable({ providedIn: 'root' })
export class ProjectExportService {
  width: number = 0;
  height: number = 0;
  constructor(private lineService: LineService) {}

  /**
   * Captures current lines from LineService and sends them to the parent project
   */
  exportCurrentDrawing() {
    const lines = this.lineService.lines;

    // Using window dimensions as canvas size, or fixed values if you prefer
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    if (lines.length === 0) {
      console.warn('No lines to export');
      return;
    }

    const base64Svg = copySVGBase64(lines);
    console.log(base64Svg);

    // Send the message using your static utility
    QlIframeMessageService.sendMessageToParent(
      {
        type: IframeMessageType.ADD_OBJECT,
        payload: {
          dataString: base64Svg,
          type: 'stickerbox',
          metaData: {
            width: canvasWidth,
            height: canvasHeight,
            name: 'Bezier Drawing',
            lineCount: lines.length,
            createdAt: new Date().toISOString(),
          },
        },
      },
      '*',
    );
  }
}
