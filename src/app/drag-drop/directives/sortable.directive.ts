import { Directive, ContentChildren, QueryList, AfterContentInit, NgZone, OnDestroy, ElementRef, Inject, Renderer2, Output, EventEmitter, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { pipe, Subject } from 'rxjs';
import { take, takeUntil, startWith, tap } from 'rxjs/operators';

import { SortableItemDirective } from './sortable-item.directive';
import { SortableItemRef, SortableRef } from '../sortable-ref';
import { DragDropRegistryService } from '../drag-drop-registry.service';
import { DragDropService } from '../drag-drop.service';

@Directive({
  selector: '[npSortable]'
})
export class SortableDirective implements AfterContentInit, OnDestroy {
  private _destroyed = new Subject();
  
  _sortRef: SortableRef<SortableDirective>;

  @Input('npSortAxis') axis: 'x' | 'y';
  @Input('npSortConnectWith') connectWith: string;

  @ContentChildren(SortableItemDirective) items: QueryList<SortableItemDirective>;

  @Output('')
  activated = new EventEmitter<any>();
  /** Before stop */
  @Output('')
  released = new EventEmitter<any>();
  /** Maybe triggered during sorting、removing、receiving */
  @Output('')
  changed = new EventEmitter<any>();
  @Output('')
  deactivated = new EventEmitter<any>();
  @Output('')
  leaved = new EventEmitter<any>();
  @Output('')
  entered = new EventEmitter<any>();
  @Output('')
  received = new EventEmitter<any>();
  @Output('')
  removed = new EventEmitter<any>();
  @Output('')
  sorting = new EventEmitter<any>();
  @Output('')
  started = new EventEmitter<any>();
  /** same to stopped */
  @Output('')
  ended = new EventEmitter<any>();
  /** same as updated of jquery-ui */
  @Output('npSortDrop')
  dropped = new EventEmitter<any>();

  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document: Document,
    private _ngZone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _dragDropRegistry: DragDropRegistryService<any, any>,
    private _renderer: Renderer2,
    dragDrop: DragDropService
  ) {
    const sortRef = this._sortRef = dragDrop.createSort(element, _renderer);

    sortRef.instance = this;
    this._syncInputs(sortRef);
    this._handleEvents(sortRef);
  }

  ngAfterContentInit() {
    // console.log(`Found ${this.items.length} items in sortable`);
    this.items.changes
      .pipe(startWith(this.items), takeUntil(this._destroyed))
      .subscribe((items: QueryList<SortableItemDirective>) => {
        const sortItems: SortableItemRef[] = items.toArray().map(it => it._dragRef as SortableItemRef);
        this._sortRef.withItems(sortItems);
      });
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  private _syncInputs(ref: SortableRef<SortableDirective>) {}
  private _handleEvents(ref: SortableRef<SortableDirective>) {
    ref.dropped$.subscribe((event) => {
      const {item, container, currentIndex, previousContainer, previousIndex, isPointerOverContainer} = event;
      this.dropped.emit({
        item: item.instance,
        container: this,
        currentIndex,
        previousContainer: previousContainer.instance,
        previousIndex,
        isPointerOverContainer,
      });
    });
  }
}
