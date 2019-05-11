import { ElementRef, NgZone } from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DraggableRef } from './draggable-ref';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { coerceElement } from '@angular/cdk/coercion';

export interface SortableItemRef extends DraggableRef { };

export class SortableRef<T> {

    private _items: SortableItemRef[];


    private _anyDragStartSubscription: Subscription;
    private _anyDragStopSubscription: Subscription;
    private _dragSubscriptions: Subscription[] = [];

    private _clientRects: ClientRect[];

    instance: T;

    constructor(
        public element: ElementRef<HTMLElement> | HTMLElement,
        private _document: Document,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<any, any>
    ) {
        this._anyDragStartSubscription = _dragDropRegistry.startDragging$.subscribe(dragRef => this._anyDragStarted(dragRef));
        this._anyDragStopSubscription = _dragDropRegistry.stopDragging$.subscribe(dragRef => this._anyDragStoped(dragRef));
    }

    withItems(items: SortableItemRef[]): this {
        this._items = items;
        return this;
    }

    despose() {
        this._anyDragStartSubscription.unsubscribe();
        this._anyDragStopSubscription.unsubscribe();
        this._removeDragSubscriptions();

    }

    private _anyDragStarted(dragRef: SortableItemRef) {
        // console.log('some drag start', dragRef, this._items, _.includes(this._items, dragRef))
        // TODO: fix to accept connected items
        if (!_.includes(this._items, dragRef)) {
            return;
        }

        this._removeDragSubscriptions();
        this._dragSubscriptions.push(
            dragRef.started.subscribe((event) => this._handleDragStart(event)),
            dragRef.moved.subscribe((event) => this._handleDragMove(event)),
        );
    }

    private _anyDragStoped(dragRef: SortableItemRef) {

    }


    private _handleDragStart(event) {
        // create and append placeholder
        // cache clientRects
        const clientRects = this._clientRects = this._items.map(item => item.getRootElement().getBoundingClientRect());
    }

    private _handleDragMove(event) {
        this._sort(event);
    }

    private _sort(event) {
        const { source, pointerPosition } = event;
        // console.log('Sort Pointer', pointerPosition)

        const currentIndex = this._items.indexOf(source);
        const currentRect = this._clientRects[currentIndex];

        this._clientRects.slice()
            .sort((rectA, rectB) => distanct(rectA, currentRect) - distanct(rectB, currentRect))
            .some(rect => {
                if (rect === currentRect) {
                    return false;
                }

                const isHorizontal = rect.top === currentRect.top;
                const isBefore = isHorizontal ? rect.left < currentRect.left : rect.top < currentRect.top;

                let moveBack = false;
                let moveForward = false;

                if (isHorizontal) {
                    moveBack = isBefore && pointerPosition.x < rect.left + rect.width / 2;
                    moveForward = !isBefore && pointerPosition.x > rect.left + rect.width / 2;
                } else {
                    moveBack = isBefore && pointerPosition.y < rect.top + rect.height / 2;
                    moveForward = !isBefore && pointerPosition.y > rect.top + rect.height / 2;
                }

                const dlta = isBefore ? 1 : -1;
                const offset = 36 * dlta;

                if (moveBack || moveForward) {
                    console.log('do sorting')
                    // TODO: do sorting and emit sort event
                    const indexs = { currentIndex: currentIndex, newIndex: this._clientRects.indexOf(rect) };
                    coerceElement(this._items[indexs.newIndex].element).style.transform = 
                        `translate3d(0, ${Math.round(offset)}px, 0)`
                    // return true;
                }

                return false;
            });

    }

    private _removeDragSubscriptions() {
        if (this._dragSubscriptions.length) {
            this._dragSubscriptions.forEach(it => it.unsubscribe());
        }
    }
}

function distanct(rectA: ClientRect, rectB: ClientRect) {
    return Math.sqrt(
        Math.pow(rectB.top - rectA.top, 2) + Math.pow(rectB.left - rectA.left, 2)
    );
}