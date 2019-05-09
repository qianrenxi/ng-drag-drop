import { ElementRef, NgZone } from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { coerceBooleanProperty, coerceElement } from '@angular/cdk/coercion';
import { Subscription, Subject } from 'rxjs';
import * as _ from 'lodash';
import { DraggableRef } from './draggable-ref';

/**
 * Specifies which mode to use for testing whether a draggable is hovering over a droppable. Possible values:
 * "fit": Draggable overlaps the droppable entirely.
 * "intersect": Draggable overlaps the droppable at least 50% in both directions.
 * "pointer": Mouse pointer overlaps the droppable.
 * "touch": Draggable overlaps the droppable any amount.
 */
export type Tolerance = 'fit' | 'intersect' | 'pointer' | 'touch';

export interface DropRefConfig {
    tolerance: Tolerance;
}

export interface DroppableRefInternal extends DroppableRef {};

export class DroppableRef<T = any> {

    private _accept: string | ((dragRef, dropRef) => boolean);
    enterPredicate: (dragRef, dropRef) => boolean = () => true;
    private _childDroppables: DroppableRef[];

    greedy: boolean = false;
    scope: string;
    tolerance: Tolerance = 'intersect';

    get isActive(): boolean {
        return this._isActive;
    }
    private _isActive: boolean = false;

    get entered(): boolean {
        return this._entered;
    }
    private _entered: boolean = false;

    private _anyDragStartSubscription: Subscription;
    private _anyDragStopSubscription: Subscription;
    private _dragSubscriptions: Subscription[] = [];

    beforeStarted$ = new Subject();
    actived$ = new Subject();
    deactived$ = new Subject();
    released$ = new Subject();
    droped$ = new Subject();
    entered$ = new Subject();
    exited$ = new Subject();
    ended$ = new Subject();

    /** Whether starting to drop this element is disabled. */
    get disabled(): boolean {
        return this._disabled;
    }
    set disabled(value: boolean) {
        const newValue = coerceBooleanProperty(value);

        if (newValue !== this._disabled) {
            this._disabled = newValue;
            // this._toggleNativeDragInteractions();
        }
    }
    private _disabled = false;

    instance: T;

    constructor(
        public element: ElementRef<HTMLElement> | HTMLElement,
        private _config: DropRefConfig,
        private _document: Document,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<any, any>
    ) {
        this._anyDragStartSubscription = _dragDropRegistry.startDragging$.subscribe(dragRef => this._anyDragStarted(dragRef));
        this._anyDragStopSubscription = _dragDropRegistry.stopDragging$.subscribe(dragRef => this._anyDragStoped(dragRef));
    }

    withAccept(accept: string | ((dragRef, dropRef) => boolean)): this {
        this._accept = accept;
        return this;
    }

    withChildDroppables(childDroppables: DroppableRef[]): this {
        this._childDroppables = childDroppables;
        return this;
    }

    despose() {
        this._anyDragStartSubscription.unsubscribe();
        this._anyDragStopSubscription.unsubscribe();
        this._removeDragSubscriptions();

        this.beforeStarted$.complete();
        this.actived$.complete();
        this.deactived$.complete();
        this.released$.complete();
        this.entered$.complete();
        this.exited$.complete();
        this.ended$.complete();
    }

    private _anyDragStarted(dragRef: DraggableRef) {
        this.beforeStarted$.next();

        // console.log('Any drag started ...')
        const canActive = this._canActive(dragRef);
        // console.log('Any drag started isActive', this._accept, isActive)

        if (!canActive) {
            // TODO: reset dropppable properties
            return;
        }

        // unsubscript 确保异常中断的情况下不会造成事件混乱
        this._removeDragSubscriptions();
        this._dragSubscriptions.push(
            dragRef.started.subscribe((event) => this._handleDragStart(event)),
            dragRef.moved.subscribe((event) => this._handleDragMove(event)),
            dragRef.released.subscribe((event) => this._handleDragReleased(event)),
            dragRef.ended.subscribe((event) => this._handleDragEnd(event)),
        )
    }

    private _anyDragStoped(dragRef) {
        // TODO: 归零
        // 问题，在Draggable中没有对stopDragging和Release/End Dragging 的调用顺序做严格的约束，在当前代码中，StopDragging 可能会在 Release 和 End Dragging之前执行，需要谨慎使用
        // 在 End 事件中已经调用，已经形成生命周期闭环，这里不需要重复执行
        // this._removeSubscriptions();
    }

    private _handleDragStart(event: { source: DraggableRef, pointerPosition: { x: number, y: number } }) {
        this._isActive = true;
        this.actived$.next({
            ...event,
            target: this
        });

        this._handlePosition(event);
    }

    private _handleDragMove(event: { source: DraggableRef, pointerPosition: { x: number, y: number } }) {
        if (!this.isActive) {
            return;
        }

        this._handlePosition(event);
    }

    private _handleDragReleased(event: { source: DraggableRef }) {
        if (!this.isActive) {
            return ;
        }

        let childrenIntersection = false;
        if (!_.isEmpty(this._childDroppables)) {
            // TODO: 过滤同时是Drag和Drop的子元素被拖动的情形
            childrenIntersection = this._childDroppables.some((dropRef: DroppableRef) => {
                return dropRef.greedy && !dropRef.disabled && dropRef.isActive && dropRef.entered;
            });
        }

        if (childrenIntersection) {
            return ;
        }

        if (this.entered) {
            this._drop(event);
        }
    }

    private _handleDragEnd(event: { source: DraggableRef }) {
        this._isActive = false;
        this._entered = false;

        this._removeDragSubscriptions();
    }

    private _handlePosition(event: { source: DraggableRef, pointerPosition: { x: number, y: number } }) {
        // 判断Source和自己是否有交叉，有的话则触发 enter， 如果已经是enter，还有交叉，则over， 如果已经是enter，没有交叉，则leave
        const element = coerceElement<HTMLElement>(this.element);
        const elementRect = element.getBoundingClientRect();
        const pointerPosition = event.pointerPosition;
        const isInRect = pointerPosition.x >= elementRect.left && pointerPosition.x <= elementRect.right && pointerPosition.y >= elementRect.top && pointerPosition.y <= elementRect.bottom;


        if (isInRect) {
            if (this.entered) {
                this._over(event);
            } else {
                this._enter(event);
            }
        } else if (this.entered) {
            this._leave(event);
        }
    }

    private _enter(event) {
        this._entered = true;

        this.entered$.next({
            ...event,
            target: this
        });

        // TODO: 可以调用 draggableRef 的方法，让 draggable 对象也触发事件，方便调用处理
    }

    private _over(event) {
        this._entered = true;
        // TODO: emit overing event
    }

    private _leave(event) {
        this._entered = false;

        this.exited$.next({
            source: event.source,
            target: this
        })
    }

    private _drop(event) {
        const {source}: {source: DraggableRef} = event;
        source.drop(this);
        
        this.droped$.next({
            ...event,
            target: this
        });
    }

    private _canActive(dragRef): boolean {
        const accept = this._accept;
        let isAccept = false;
        if (_.isString(accept)) {
            const rootElement = coerceElement(dragRef.getRootElement());
            const element = coerceElement(dragRef.element);

            isAccept = isElementMatchSelector(rootElement, accept) || isElementMatchSelector(element, accept);
        } else if (_.isFunction(accept)) {
            isAccept = accept(dragRef, this);
        }

        if (isAccept && this.enterPredicate && _.isFunction(this.enterPredicate)) {
            isAccept = this.enterPredicate(dragRef, this);
        }

        return isAccept;
    }

    private _removeDragSubscriptions() {
        if (this._dragSubscriptions.length) {
            this._dragSubscriptions.forEach(it => it.unsubscribe());
        }
    }
}

function isElementMatchSelector(element: HTMLElement, selector: string) {
    return element.matches ? element.matches(selector) :
        (element as any).msMatchesSelector(selector);
}