import { ElementRef, NgZone, Renderer2 } from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DraggableRef } from './draggable-ref';
import { Subscription, Subject } from 'rxjs';
import * as _ from 'lodash';
import { coerceElement } from '@angular/cdk/coercion';
import { moveItemInArray } from './drag-utils';

interface CachedItemPosition {
    /** Instance of the drag item. */
    item: SortableItemRef;
    /** Dimensions of the item. */
    clientRect: ClientRect;
    /** Amount by which the item has been moved since dragging started. */
    offset: number;
}


export interface SortableItemRef extends DraggableRef { };

export class SortableRef<T = any> {

    private _items: SortableItemRef[];

    private _anyDragStartSubscription: Subscription;
    private _anyDragStopSubscription: Subscription;
    private _dragSubscriptions: Subscription[] = [];

    private _clientRects: ClientRect[];

    private _itemPositions: CachedItemPosition[];

    private _siblings: SortableRef[];
    private _activeSiblings: SortableRef[];
    private _isActivated: boolean = false;

    axis: 'x' | 'y';
    // floating: boolean = false;

    instance: T;

    beforStarted = new Subject<any>();

    activated$ = new Subject<any>();
    /** Before stop */
    released$ = new Subject<any>();
    /** Maybe triggered during sorting、removing、receiving */
    changed$ = new Subject<any>();
    deactivated$ = new Subject<any>();
    /** out */
    leaved$ = new Subject<any>();

    /** over the container at first time, even if it nerver being moved out */
    entered$ = new Subject<any>();
    received$ = new Subject<any>();
    removed$ = new Subject<any>();
    sorting$ = new Subject<any>();
    started$ = new Subject<any>();
    /** same to stopped  */
    ended$ = new Subject<any>();
    /** same as updated of jquery-ui */
    dropped$ = new Subject<{
        item: SortableItemRef,
        container: SortableRef,
        currentIndex: number,
        previousContainer: SortableRef,
        previousIndex: number,
        isPointerOverContainer: boolean
    }>();

    constructor(
        public element: ElementRef<HTMLElement> | HTMLElement,
        private _document: Document,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<any, any>,
        private renderer: Renderer2,
    ) {
        this._anyDragStartSubscription = _dragDropRegistry.startDragging$.subscribe(dragRef => this._anyDragStarted(dragRef));
        this._anyDragStopSubscription = _dragDropRegistry.stopDragging$.subscribe(dragRef => this._anyDragStoped(dragRef));
    }

    withItems(items: SortableItemRef[]): this {
        this._items = items;
        return this;
    }

    connectWith(sortables: SortableRef[]): this {
        this._siblings = sortables.slice();
        return this;
    }

    despose() {
        this._anyDragStartSubscription.unsubscribe();
        this._anyDragStopSubscription.unsubscribe();
        this._removeDragSubscriptions();

    }

    getIndexOfItem(item: SortableItemRef) {
        return _.indexOf(this._items, item);
    }

    isActivated() {
        return this._isActivated;
    }

    markAsActivated(event) {
        this._isActivated = true;
        this.activated$.next(event);
    }

    markAsDeactivated(event) {
        this._isActivated = false;
        this.deactivated$.next(event);
    }

    private _anyDragStarted(dragRef: SortableItemRef) {
        // console.log('some drag start', dragRef, this._items, _.includes(this._items, dragRef))
        // TODO: fix to accept connected items
        if (!_.includes(this._items, dragRef)) {
            return;
        }

        // Call to create placeholder
        // dragRef.initDragHelpers();

        this._removeDragSubscriptions();
        this._dragSubscriptions.push(
            dragRef.started.subscribe((event) => this._handleDragStart(event)),
            dragRef.moved.subscribe((event) => this._handleDragMove(event)),
            // dragRef.released.subscribe((event) => this._handleDragRelease(event)),
            dragRef.ended.subscribe((event) => this._handleDragEnd(event)),
        );
    }

    private _anyDragStoped(dragRef: SortableItemRef) {
        // this._removeDragSubscriptions();
    }


    private _handleDragStart(event) {
        this.beforStarted.next();
        
        // TODO: Filter active siblings
        this._activeSiblings = this._siblings;
        this._activeSiblings.forEach(it => it.markAsActivated(event));

        const { source } = event;
        source.initDragHelpers();

        this._cacheItemPositions();
    }

    private _handleDragMove(event) {
        this._contactContainers(event);

        this._sort(event);
    }

    private _handleDragRelease(event) {
        // const {source }: {source: SortableItemRef} = event;
        // const previousContainer = this;
        // const previousIndex = previousContainer.getIndexOfItem(source);

        // const currentIndex = _.findIndex(this._itemPositions, (it) => it.item === source);

        // console.log(previousIndex, currentIndex);
    }

    private _handleDragEnd(event) {
        const { source }: { source: SortableItemRef } = event;
        const previousContainer = this;
        const previousIndex = previousContainer.getIndexOfItem(source);

        const currentIndex = _.findIndex(this._itemPositions, (it) => it.item === source);

        // deactivate siblings
        this._siblings.forEach(it => it.markAsDeactivated(event));

        // console.log(previousIndex, currentIndex);
        this.dropped$.next({
            item: source,
            container: this,
            currentIndex: currentIndex,
            previousContainer: previousContainer,
            previousIndex: previousIndex,
            isPointerOverContainer: true
        });
    }

    private _contactContainers(event) {
        // TODO: This is not innermost method...
        // and the siblings shoud contain self
        const innermostSibling = this._activeSiblings.find(it => this._intersectsWith(coerceElement(it.element)));
        // TODO mark out of not intersected siblings

        if (!innermostSibling) {
            return ;
        }

        {
            // find 
        }

    }

    private _sort(event) {
        const { source, pointerPosition, delta }: { source: SortableItemRef, pointerPosition: { x: number, y: number }, delta: any } = event;
        // console.log('Sort Pointer', pointerPosition, delta)

        // const currentIndex = this._items.indexOf(source);
        // const currentRect = this._clientRects[currentIndex];
        // const placeholder = source.getPlaceholder();

        // this._clientRects.slice()
        this._items.slice().forEach((item, index) => {
            const itemElement = item.getRootElement();
            const intersection = this._intersectsWithPointer(itemElement, pointerPosition, delta);

            if (!intersection) {
                return;
            }

            if (item === source) {
                return;
            }

            // if ((intersection === 1 ? placeholder.previousSibling : placeholder.nextSibling) === itemElement) {
            //     return;
            // }

            const direction = intersection === 1 ? 'down' : 'up';

            if (this._intersectsWithSides(itemElement, pointerPosition, delta)) {
                this._rearrange(event, direction, item);

                const currentIndex = _.findIndex(this._itemPositions, (it) => it.item === source);
                const newIndex = index;
                // console.log('sorting', currentIndex, newIndex)
                moveItemInArray(this._itemPositions, currentIndex, newIndex);
            }

            // TODO: Emit sorting
        });

    }

    private _cacheItemPositions() {
        const isHorizontal = false;
        this._itemPositions = this._items.map(item => {
            const elementToMeasure = this._dragDropRegistry.isDragging(item) ?
                item.getPlaceholder() :
                item.getRootElement();
            const clientRect = elementToMeasure.getBoundingClientRect();

            return <CachedItemPosition>{
                item: item,
                offset: 0,
                clientRect: { ...clientRect }
            };
        }).sort((a, b) => {
            return (a.clientRect.top - b.clientRect.top)
            // return isHorizontal ? 
            //     ((a.clientRect.left - b.clientRect.left) || (a.clientRect.top - b.clientRect.top)) :
            //     ((a.clientRect.top - b.clientRect.top) || (a.clientRect.left - b.clientRect.left));
        });
    }

    private _rearrange(event, direction, item: SortableItemRef, ) {
        const { source }: { source: SortableItemRef } = event;
        const placeholder = source.getPlaceholder();

        const itemElement = item.getRootElement();
        itemElement.parentNode.insertBefore(placeholder, (direction === "down" ? itemElement : itemElement.nextSibling))
    }

    private _isOverAxis(x, reference, size) {
        return (x >= reference) && (x < (reference + size));
    }

    private _isFloating(item: HTMLElement) {
        const itemStyle = window.getComputedStyle(item);
        return (/left|right/).test(itemStyle.cssFloat) ||
            (/inline|table-cell/).test(itemStyle.display);
    }

    private _intersectsWith(item: HTMLElement) {
        return false;
    }

    private _intersectsWithPointer(item: HTMLElement, pointerPosition: Point, delta: any) {
        const rect = item.getBoundingClientRect();
        const isOverElementHeight = (this.axis === 'x') || this._isOverAxis(pointerPosition.y, rect.top, rect.height);
        const isOverElementWidth = (this.axis === 'y') || this._isOverAxis(pointerPosition.x, rect.left, rect.width);

        const isOverElement = isOverElementHeight && isOverElementWidth;

        if (!isOverElement) {
            return false;
        }

        // const { verticalDirection, horizontalDirection}: { x as  }
        const verticalDirection = delta.y;
        const horizontalDirection = delta.x;

        const floating = this.axis === 'x' || this._isFloating(item);
        return floating ?
            ((horizontalDirection === 1 || verticalDirection === 1) ? 2 : 1) :
            (verticalDirection && (verticalDirection === 1 ? 2 : 1));
    }

    private _intersectsWithSides(item: HTMLElement, pointerPosition: Point, delta: any) {
        const rect = item.getBoundingClientRect();
        const isOverBottomHalf = this._isOverAxis(pointerPosition.y, rect.top + (rect.height / 2), rect.height);
        const isOverRightHalf = this._isOverAxis(pointerPosition.x, rect.left + (rect.width / 2), rect.width);
        const verticalDirection = delta.y;
        const horizontalDirection = delta.x;

        const floating = this.axis === 'x' || this._isFloating(item);

        if (floating && horizontalDirection) {
            return (horizontalDirection === 1 && isOverRightHalf) ||
                (horizontalDirection === -1 && !isOverRightHalf);
        } else {
            return verticalDirection &&
                ((verticalDirection === 1 && isOverBottomHalf) ||
                    (verticalDirection === -1 && !isOverBottomHalf));
        }

    }


    private _removeDragSubscriptions() {
        if (this._dragSubscriptions.length) {
            this._dragSubscriptions.forEach(it => it.unsubscribe());
        }
    }
}

interface Point {
    x: number;
    y: number;
}

function distanct(rectA: ClientRect, rectB: ClientRect) {
    return Math.sqrt(
        Math.pow(rectB.top - rectA.top, 2) + Math.pow(rectB.left - rectA.left, 2)
    );
}