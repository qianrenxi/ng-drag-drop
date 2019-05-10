import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '../drag-drop/drag-drop.module';
import { DragDropDemoRoutingModule } from './drag-drop-demo-routing.module';
import { DraggableDemoModule } from './draggable-demo/draggable-demo.module';
import { DroppableDemoModule } from './droppable-demo/droppable-demo.module';
import { SortableDemoModule } from './sortable-demo/sortable-demo.module';


@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    DragDropDemoRoutingModule,
    DraggableDemoModule,
    DroppableDemoModule,
    SortableDemoModule,
  ],
  declarations: [

  ],
})
export class DragDropDemoModule { }
