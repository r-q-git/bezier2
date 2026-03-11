import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import {MainComponent } from './main/main.component';
import { ToastComponent } from './toast/toast.component';
import { ControlsHelpComponent } from './controls-help/controls-help.component';
import { ContainerComponent } from './container/container.component';
import { AddComponent } from './add/add.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AddToProjectComponent } from './add-to-project/add-to-project.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ToastComponent,
    ControlsHelpComponent,
    ContainerComponent,
    AddComponent,
    ToolbarComponent,
    AddToProjectComponent,
  ],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
