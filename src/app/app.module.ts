import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LineComponent } from './line/line.component';
import { Line2Component } from './line2/line2.component';

@NgModule({
  declarations: [AppComponent, LineComponent, Line2Component],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
