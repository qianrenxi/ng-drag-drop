import { Directive, ContentChildren, QueryList, AfterContentInit, NgZone, OnDestroy, ElementRef, Inject } from '@angular/core';
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

  @ContentChildren(SortableItemDirective) items: QueryList<SortableItemDirective>;

  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document: Document,
    private _ngZone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _dragDropRegistry: DragDropRegistryService<any, any>,
    dragDrop: DragDropService
  ) {
    const sortRef = this._sortRef = dragDrop.createSort(element);

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
  private _handleEvents(ref: SortableRef<SortableDirective>) {}
}
