import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[npDragPreview]'
})
export class DragPreviewDirective<T = any> {

  /** Context data to be added to the preview template instance */
  @Input() data: T;

  constructor(public templateRef: TemplateRef<T>) { }

}
