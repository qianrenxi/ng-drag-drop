import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[npDragPlaceholder]'
})
export class DragPlaceholderDirective<T = any> {

    /** Context data to be added to the preview template instance */
    @Input() data: T;

    constructor(public templateRef: TemplateRef<T>) { }

}
