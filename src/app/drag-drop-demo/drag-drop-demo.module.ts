import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '../drag-drop/drag-drop.module';
import { DragDropDemoRoutingModule } from './drag-drop-demo-routing.module';
import { DraggableDemoComponent } from './draggable-demo/draggable-demo.component';

@NgModule({
  declarations: [DraggableDemoComponent],
  imports: [
    CommonModule,
    DragDropModule,
    DragDropDemoRoutingModule,
  ]
})
export class DragDropDemoModule { }
