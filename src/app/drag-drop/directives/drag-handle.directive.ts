import { Directive, OnDestroy, Input, ElementRef, Inject, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { NP_DRAG_PARENT } from '../drag-parent';
import { toggleNativeDragInteractions } from '../drag-styling';

@Directive({
  selector: '[npDragHandle]'
})
export class DragHandleDirective implements OnDestroy {

  parentDrag: {} | undefined;

  stateChanges = new Subject<DragHandleDirective>();

  @Input('npDragHandleDisabled')
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next(this);
  }
  private _disabled = false;
    
  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(NP_DRAG_PARENT) @Optional() parentDrag?: any,
  ) {
    this.parentDrag = parentDrag;
    toggleNativeDragInteractions(element.nativeElement, false);
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

}
