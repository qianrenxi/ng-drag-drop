import { Directive, ContentChildren, QueryList, AfterContentInit, NgZone, OnDestroy, ElementRef, Inject, Renderer2, Output, EventEmitter, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { pipe, Subject } from 'rxjs';
import { take, takeUntil, startWith, tap } from 'rxjs/operators';

import { SortableItemDirective } from './sortable-item.directive';
import { SortableItemRef, SortableRef } from '../sortable-ref';
import { DragDropRegistryService } from '../drag-drop-registry.service';
import { DragDropService } from '../drag-drop.service';
import * as _ from 'lodash';
import { coerceElement } from '@angular/cdk/coercion';

@Directive({
  selector: '[npSortable]'
})
export class SortableDirective implements AfterContentInit, OnDestroy {
  private static _globalSortables: SortableDirective[] = [];

  private _destroyed = new Subject();

  _sortRef: SortableRef<SortableDirective>;

  @Input('npSortAxis') axis: 'x' | 'y';
  @Input('npSortConnectWith') connectWith: string;

  @ContentChildren(SortableItemDirective) items: QueryList<SortableItemDirective>;
  // @ContentChildren(SortableDirective) childSortables: QueryList<SortableDirective>;

  @Output('npSortActivate')
  activated = new EventEmitter<any>();
  /** Before stop */
  @Output('npSortRelease')
  released = new EventEmitter<any>();
  /** Maybe triggered during sorting、removing、receiving */
  @Output('npSortChange')
  changed = new EventEmitter<any>();
  @Output('npSortDeactivate')
  deactivated = new EventEmitter<any>();
  @Output('npSortLeave')
  leaved = new EventEmitter<any>();
  @Output('npSortEntere')
  entered = new EventEmitter<any>();
  @Output('npSortReceive')
  received = new EventEmitter<any>();
  @Output('npSortRemove')
  removed = new EventEmitter<any>();
  @Output('npSortSorting')
  sorting = new EventEmitter<any>();
  @Output('npSortStarte')
  started = new EventEmitter<any>();
  /** same to stopped */
  @Output('npSortEnd')
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

    SortableDirective._globalSortables.push(this);
  }

  ngAfterContentInit() {
    // console.log(`Found ${this.items.length} items in sortable`);
    this._ngZone.onStable.asObservable()
      .pipe(take(1), takeUntil(this._destroyed))
      .subscribe(() => {
        this.items.changes
          .pipe(startWith(this.items), takeUntil(this._destroyed))
          .subscribe((items: QueryList<SortableItemDirective>) => {
            const sortItems: SortableItemRef[] = items.toArray().map(it => it._dragRef as SortableItemRef);
            this._sortRef.withItems(sortItems);
          });
        // this.childSortables.changes
        //   .pipe(startWith(this.childSortables), takeUntil(this._destroyed))
        //   .subscribe((childSortables: QueryList<SortableDirective>) => {
        //     const children: SortableRef[] = childSortables.toArray()
        //       .filter(it => it === this)
        //       .map(it => it._sortRef);
        //     this._sortRef.withChildren(children);
        //   });
      })
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();

    _.remove(SortableDirective._globalSortables, this);
  }

  private _syncInputs(ref: SortableRef<SortableDirective>) {
    ref.beforStarted.subscribe(() => {
      const siblings = SortableDirective._globalSortables
        .filter(it => isElementMatchSelector(coerceElement(it.element), this.connectWith))
        .map(it => it._sortRef);

      ref.connectWith(siblings);
    });
  }

  private _handleEvents(ref: SortableRef<SortableDirective>) {
    ref.dropped$.subscribe((event) => {
      const { item, container, currentIndex, previousContainer, previousIndex, isPointerOverContainer } = event;
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

function isElementMatchSelector(element: HTMLElement, selector: string) {
  return element.matches ? element.matches(selector) :
    (element as any).msMatchesSelector(selector);
}
