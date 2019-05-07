import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DragDropDemoModule } from './drag-drop-demo/drag-drop-demo.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DragDropDemoModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
