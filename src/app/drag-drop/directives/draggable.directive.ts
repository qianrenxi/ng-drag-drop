import { Directive, ElementRef, Input, ContentChildren, QueryList, ContentChild, ViewContainerRef, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, NgZone, Inject, Output, EventEmitter, forwardRef, HostBinding } from '@angular/core';
import { DragDropService } from '../drag-drop.service';
import { DraggableRef, DragHelperTemplate } from '../draggable-ref';
import { DragHandleDirective } from './drag-handle.directive';
import { DragPreviewDirective } from './drag-preview.directive';
import { DragPlaceholderDirective } from './drag-placeholder.directive';
import { Subject, merge, Observable, Observer } from 'rxjs';
import { take, takeUntil, startWith, tap, switchMap, map } from 'rxjs/operators';
import { NP_DRAG_PARENT } from '../drag-parent';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import { DragStartEvent, DragReleaseEvent, DragEndEvent, DragEnterEvent, DragExitEvent, DragDropEvent, DragMoveEvent } from '../drag-events';

/**
 * 可拖动元素指令
 */
@Directive({
  selector: '[npDraggable]',
  providers: [
    { provide: NP_DRAG_PARENT, useExisting: forwardRef(() => DraggableDirective) }
  ]
})
export class DraggableDirective<D = any> implements AfterViewInit, OnChanges, OnDestroy {
  protected _destroyed = new Subject<void>();

  _dragRef: DraggableRef<DraggableDirective<D>>;

  /** 用来控制拖动的元素，没有时整个元素可触发拖动 */
  @ContentChildren(DragHandleDirective, { descendants: true }) _handles: QueryList<DragHandleDirective>;

  @ContentChild(DragPreviewDirective) _previewTemplate: DragPreviewDirective;
  @ContentChild(DragPlaceholderDirective) _placeholderTemplate: DragPlaceholderDirective;

  @Input('npDragData') dragData: D;

  @Input('npLockAxis') lockAxis: 'x' | 'y';

  @Input('npDragRevert') _revert: boolean | 'invalid' | 'valid';

  @Input('npDragRootElement') rootElementSelector: string;

  @Input('npDragBoundary') boundaryElementSelector: string;

  @Input('npDragDisabled')
  get disabled(): boolean {
    return this._disabled // || (this.dropContainer && this.dropContainer.disabled);
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._dragRef.disabled = this._disabled;
  }
  protected _disabled = false;

  @Output('npDragStarted') started = new EventEmitter<DragStartEvent>();
  @Output('npDragReleased') released = new EventEmitter<DragReleaseEvent>();
  @Output('npDragEnded') ended = new EventEmitter<DragEndEvent>();
  @Output('npDragEntered') entered = new EventEmitter<DragEnterEvent>();
  @Output('npDragExited') exited = new EventEmitter<DragExitEvent>();
  @Output('npDragDropped') dropped = new EventEmitter<DragDropEvent>();
  
  @Output('npDragMoved') moved: Observable<DragMoveEvent> = new Observable((observer: Observer<DragMoveEvent>) => {
    const subscription = this._dragRef.moved.pipe(map(movedEvent => ({
      source: this,
      pointerPosition: movedEvent.pointerPosition,
      event: movedEvent.event,
      delta: movedEvent.delta
    }))).subscribe(observer);

    return () => {
      subscription.unsubscribe();
    };
  });

  @HostBinding('class.np-drag-dragging')
  get bindDraggingClass() {
    return this._dragRef.isDragging();
  }

  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) protected _document: Document,
    protected _viewContainerRef: ViewContainerRef,
    protected _ngZone: NgZone,
    dragDrop: DragDropService
  ) {
    const dragRef = this._dragRef = dragDrop.createDrag<DraggableDirective>(element);

    dragRef.instance = this;
    this._syncInputs(dragRef);
    this._handleEvents(dragRef);
  }

  ngAfterViewInit() {
    this._ngZone.onStable.asObservable()
      .pipe(take(1), takeUntil(this._destroyed))
      .subscribe(() => {
        this._updateRootElement();
        // console.log("Handles", this._handles)
        this._handles.changes.pipe(
          startWith(this._handles),
          tap((handles: QueryList<DragHandleDirective>) => {
            const childHandleElements = handles
              .filter(handle => handle.parentDrag === this)
              .map(handle => handle.element);
              // console.log("Handles", childHandleElements)
            this._dragRef.withHandles(childHandleElements);
          }),
          switchMap((handles: QueryList<DragHandleDirective>) => {
            return merge(...handles.map(item => item.stateChanges));
          }),
          takeUntil(this._destroyed)
        ).subscribe(handelInstance => {
          const dragRef = this._dragRef;
          const handle = handelInstance.element.nativeElement;
          handelInstance.disabled ? dragRef.disableHandle(handle) : dragRef.enableHandle(handle);
        });
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const rootSelectorChange = changes['rootElementSelector'];

    // We don't have to react to the first change since it's being
    // handled in `ngAfterViewInit` where it needs to be deferred.
    if (rootSelectorChange && !rootSelectorChange.firstChange) {
      this._updateRootElement();
    }
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
    this._dragRef.dispose();
  }

  /** Resets a standalone drag item to its initial position. */
  public revert(): void {
    this._dragRef.revert();
  }

  /** 在准备拖放时将Draggable的元素输入与底层DraggableRef做同步 */
  protected _syncInputs(ref: DraggableRef<DraggableDirective<D>>) {
    ref.beforeStarted.subscribe(() => {
      if (ref.isDragging()) {
        return;
      }

      const placeholder = this._placeholderTemplate ? <DragHelperTemplate>{
        template: this._placeholderTemplate.templateRef,
        context: this._placeholderTemplate.data,
        viewContainer: this._viewContainerRef,
      } : null;
      const preview = this._previewTemplate ? <DragHelperTemplate>{
        template: this._previewTemplate.templateRef,
        context: this._previewTemplate.data,
        viewContainer: this._viewContainerRef,
      } : null;

      ref._revert = (this._revert === 'valid' || this._revert === 'invalid') ? this._revert : coerceBooleanProperty(this._revert);
      ref.disabled = this.disabled;
      ref.lockAxis = this.lockAxis;
      ref.withBoundaryElement(this._getBoundaryElement())
        .withPlaceholderTemplate(placeholder)
        .withPreviewTemplate(preview);
    });
  }

  protected _handleEvents(ref: DraggableRef<DraggableDirective<D>>) {
    ref.started.subscribe(() => {
      this.started.emit({source: this});
    });

    ref.released.subscribe(() => {
      this.released.emit({source: this});
    });

    ref.ended.subscribe(() => {
      this.ended.emit({source: this});
    });

    ref.entered.subscribe((event) => {
      this.entered.emit({container: null, item: this});
    });

    ref.exited.subscribe((event) => {
      this.exited.emit({ container: null, item: this});
    });

    ref.dropped.subscribe((event) => {
      this.dropped.emit({
        previousIndex: 0, // event.previousIndex,
        currentIndex: 0, // event.currentIndex,
        previousContainer: null, // event.previousContainer.data,
        container: null, // event.container.data,
        isPointerOverContainer: false, // event.isPointerOverContainer,
        item: this
      });
    });
  }

  protected _getBoundaryElement(): HTMLElement {
    const selector = this.boundaryElementSelector;
    return selector ? getClosestMatchingAncestor(this.element.nativeElement, selector) : null;
  }

  protected _updateRootElement() {
    const element = this.element.nativeElement;
    const rootElement = this.rootElementSelector ?
      getClosestMatchingAncestor(element, this.rootElementSelector) : element;

    if (rootElement && rootElement.nodeType !== this._document.ELEMENT_NODE) {
      throw Error(`cdkDrag must be attached to an element node. ` +
        `Currently attached to "${rootElement.nodeName}".`);
    }

    this._dragRef.withRootElement(rootElement || element);
  }

}

/** Gets the closest ancestor of an element that matches a selector. */
function getClosestMatchingAncestor(element: HTMLElement, selector: string) {
  let currentElement = element.parentElement as HTMLElement | null;

  while (currentElement) {
    // IE doesn't support `matches` so we have to fall back to `msMatchesSelector`.
    if (currentElement.matches ? currentElement.matches(selector) :
      (currentElement as any).msMatchesSelector(selector)) {
      return currentElement;
    }

    currentElement = currentElement.parentElement;
  }

  return null;
}