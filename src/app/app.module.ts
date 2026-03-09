import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { Line2Component } from './line2/line2.component';
import { ToastComponent } from './toast/toast.component';
import { ControlsHelpComponent } from './controls-help/controls-help.component';

@NgModule({
  declarations: [AppComponent, Line2Component, ToastComponent, ControlsHelpComponent],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
