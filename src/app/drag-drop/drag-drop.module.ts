import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraggableDirective } from './directives/draggable.directive';
import { DragDropService } from './drag-drop.service';
import { DragHandleDirective } from './directives/drag-handle.directive';
import { DragPlaceholderDirective } from './directives/drag-placeholder.directive';
import { DragPreviewDirective } from './directives/drag-preview.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    DraggableDirective,
    DragHandleDirective,
    DragPlaceholderDirective,
    DragPreviewDirective
  ],
  exports: [
    DraggableDirective,
    DragHandleDirective,
    DragPlaceholderDirective,
    DragPreviewDirective
  ],
  providers: [
    DragDropService,
  ]
})
export class DragDropModule { }
