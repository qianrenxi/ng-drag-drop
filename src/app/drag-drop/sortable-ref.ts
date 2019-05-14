import { ElementRef, NgZone, Renderer2 } from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DraggableRef } from './draggable-ref';
import { Subscription, Subject } from 'rxjs';
import * as _ from 'lodash';
import { coerceElement } from '@angular/cdk/coercion';
import { moveItemInArray } from './drag-utils';
import { element } from 'protractor';

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
    // private _childSortables: SortableRef[];

    private _anyDragStartSubscription: Subscription;
    private _anyDragStopSubscription: Subscription;
    private _dragSubscriptions: Subscription[] = [];

    private _clientRects: ClientRect[];

    private _itemPositions: CachedItemPosition[];

    private _siblings: SortableRef[];
    private _activeSiblings: SortableRef[];
    private _isActivated: boolean = false;

    get entered(): boolean {
        return this._entered;
    }
    private _entered: boolean = false;

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

    // withChildren(children: SortableRef[]): this {
    //     this._childSortables = children;
    //     return this;
    // }

    connectWith(sortables: SortableRef[]): this {
        this._siblings = sortables.slice();
        return this;
    }

    despose() {
        this._anyDragStartSubscription.unsubscribe();
        this._anyDragStopSubscription.unsubscribe();
        this._removeDragSubscriptions();

    }

    getIndexOfItem(item: SortableItemRef): number {
        return _.indexOf(this._items, item);
    }

    isActivated(): boolean {
        return !!this._isActivated;
    }

    markAsActivated(event) {
        this._isActivated = true;
        this.activated$.next(event);
    }

    markAsDeactivated(event) {
        this._isActivated = false;
        this.deactivated$.next(event);
    }

    // contains(target: SortableRef): boolean {
    //     return _.includes(this._childSortables, target);
    // }

    enter(event, initContainer) {
        // TODO: extract to a method
        const { source, pointerPosition, delta }: { source: SortableItemRef, pointerPosition: Point, delta } = event;
        // const currentItemElement = source.getRootElement();
        // const dist = 10000;
        // const floating = this._isFloating(currentItemElement);
        // const posProperty = floating ? 'left' : 'top';
        // const sizeProperty = floating ? 'width' : 'height';
        // const axis = floating ? 'x' : 'y';

        let itemWithLeastDistance = null;
        let direction = null;

        // // if (_.isEmpty(this._items) && !this.dropOnEmpty) {  return false; }

        if (!_.isEmpty(this._items)) {
            this._items.forEach((item, index) => {
                const itemElement = item.getRootElement();
                if (!coerceElement(this.element).contains(itemElement)) {
                    return;
                }

                if (item === source) {
                    return;
                }

                // TODO, 优化定位，解决闪动的问题
                const intersect = this._intersectsWithPointer(itemElement, pointerPosition, delta);

                if (!intersect) {
                    return;
                }

                itemWithLeastDistance = item;
                direction = intersect === 1 ? 'down' : 'up';
            });
        }

        if (itemWithLeastDistance) {
            this._rearrange(event, direction, itemWithLeastDistance);
        } else {
            // 可以解决空容器的问题
            this._rearrange(event, direction);
        }

        // TODO emit change,
        // TODO shuld emit change after enter, so 应该调整时间及相应处理逻辑的先后顺序
        // 但是，jQuery UI也是先触发了 change 然后是over的，值得商榷

        this._entered = true;
        this.entered$.next({
            ...event,
            target: this
        });

        if (!_.includes(this._items, source)) {
            this.beforStarted.next();
            this._cacheItemPositions(source);

            this._dragSubscriptions.push(
                source.moved.subscribe((event) => {
                    this._sort(event);
                }),
                source.ended.subscribe((event) => {
                    // console.log("other container catch end", source);
                    this._handleDragEnd(event, initContainer);
                })
            );
        }
    }

    leave(event) {
        this._entered = false;

        const { source }: { source: SortableItemRef } = event;
        if (!_.includes(this._items, source)) {
            this._removeDragSubscriptions();
        }
    }

    cancel() {
        this._entered = false;
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
        const innermostContainer = this._contactContainers(event);

        // this._sort(event);
        // expect must be found
        if (innermostContainer === this) {
            this._sort(event);
        }
    }

    private _handleDragRelease(event) {
        // const {source }: {source: SortableItemRef} = event;
        // const previousContainer = this;
        // const previousIndex = previousContainer.getIndexOfItem(source);

        // const currentIndex = _.findIndex(this._itemPositions, (it) => it.item === source);

        // console.log(previousIndex, currentIndex);
    }

    private _handleDragEnd(event, initialContainer?) {
        const { source }: { source: SortableItemRef } = event;
        const previousContainer = initialContainer || this;
        const previousIndex = previousContainer.getIndexOfItem(source);

        const currentIndex = _.findIndex(this._itemPositions, (it) => it.item === source);

        if (initialContainer === this) {
            // deactivate siblings
            this._siblings.forEach(it => it.markAsDeactivated(event));
        }

        // console.log(previousIndex, currentIndex);
        this.dropped$.next({
            item: source,
            container: this,
            currentIndex: currentIndex,
            previousContainer: previousContainer,
            previousIndex: previousIndex,
            isPointerOverContainer: true
        });

        if (initialContainer === this) {
            this._activeSiblings.forEach(it => {
                it.cancel();
            });
        }
    }

    private _contactContainers(event) {
        const { source, pointerPosition, delta }: { source: SortableItemRef, pointerPosition: Point, delta } = event;
        const currentItem = source;
        const currentItemElement = currentItem.getRootElement();

        const containers = _.isEmpty(this._activeSiblings) ? [this] : _.concat(this, this._activeSiblings); // 可能已包含自己，去重...
        // const innermostSibling = this._activeSiblings.find(it => this._intersectsWith(coerceElement(it.element)));
        let innermostContainer: SortableRef = null;
        let innermostIndex = null; // 没有实际的参考价值，目标数组对象是不可控的 

        containers.forEach((container, index) => {
            const containerElement = coerceElement(container.element);
            // Never consider a container that's located within the item itself.
            if (currentItemElement!.contains(containerElement)) {
                return;
            }

            // console.log(pointerPosition)
            // console.log(index, containerElement.getBoundingClientRect())
            if (this._intersectsWith(containerElement, pointerPosition, delta)) {
                // If we've already found a container and it's more "inner" than this, then continue
                if (innermostContainer && containerElement.contains(coerceElement(innermostContainer.element))) {
                    return;
                }

                innermostContainer = container;
                innermostIndex = index;
            } else {
                // container dosen't intersect, emit "out" event if necessary
                if (container.entered) {
                    // mark out of container
                    container.leave(event);
                }
            }
        });

        if (!innermostContainer) {
            return;
        }

        if (innermostContainer === this) {
            if (!this.entered) {
                // TODO: mark enter into the container
                this._entered = true;
            }

            // return ;
        } else {
            // When entering a new container, we will find the item with the least distance and
            // append our item near it
            if (!innermostContainer.entered) {
                innermostContainer.enter(event, this);
            }

        }

        return innermostContainer;
    }

    _sort(event) {
        if (!this.enter) {
            return;
        }

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

    private _cacheItemPositions(outerItem?) {
        const isHorizontal = false;
        this._itemPositions = (outerItem ? [...this._items, outerItem] : this._items).map(item => {
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

    private _rearrange(event, direction, item?: SortableItemRef, ) {
        const { source }: { source: SortableItemRef } = event;
        const placeholder = source.getPlaceholder();

        if (!!item) {
            const itemElement = item.getRootElement();
            itemElement.parentNode.insertBefore(placeholder, (direction === "down" ? itemElement : itemElement.nextSibling))
        } else {
            const containerElement = coerceElement(this.element);
            containerElement.appendChild(placeholder);
        }
    }

    private _isOverAxis(x, reference, size) {
        return (x >= reference) && (x < (reference + size));
    }

    private _isFloating(item: HTMLElement) {
        const itemStyle = window.getComputedStyle(item);
        return (/left|right/).test(itemStyle.cssFloat) ||
            (/inline|table-cell/).test(itemStyle.display);
    }

    // Be careful with the following core functions
    private _intersectsWith(item: HTMLElement, pointerPosition: Point, delta: any) {
        return this._intersectsWithPointer(item, pointerPosition, delta);
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
