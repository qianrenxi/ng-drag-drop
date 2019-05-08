import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraggableDirective } from './directives/draggable.directive';
import { DragDropService } from './drag-drop.service';
import { DragHandleDirective } from './directives/drag-handle.directive';
import { DragPlaceholderDirective } from './directives/drag-placeholder.directive';
import { DragPreviewDirective } from './directives/drag-preview.directive';
import { DroppableDirective } from './directives/droppable.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    DraggableDirective,
    DragHandleDirective,
    DragPlaceholderDirective,
    DragPreviewDirective,
    DroppableDirective
  ],
  exports: [
    DraggableDirective,
    DragHandleDirective,
    DragPlaceholderDirective,
    DragPreviewDirective,
    DroppableDirective
  ],
  providers: [
    DragDropService,
  ]
})
export class DragDropModule { }
