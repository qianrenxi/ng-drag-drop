import { ElementRef, NgZone } from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

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

export class DroppableRef<T = any> {

    private _accept: string | ((dragRef, dropRef) => boolean);
    private _enterPredicate: (dragRef, dropRef) => boolean = () => true; 

    private _isActive: boolean = false;

    private _subscriptions: Subscription[] = [];

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
        element: ElementRef<HTMLElement> | HTMLElement,
        private _config: DropRefConfig,
        private _document: Document,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<any, any>
    ) {
        _dragDropRegistry.startDragging$.subscribe(dragRef => this._anyDragStarted(dragRef));
        _dragDropRegistry.stopDragging$.subscribe(dragRef => this._anyDragStoped(dragRef));
    }

    despose() {
        this._removeSubscriptions();
    }

    private _anyDragStarted(dragRef) {
        if (this._canEnter(dragRef)) {
            this._isActive = false;
            // TODO: clear drop container
            return ;
        }

        this._isActive = true;
        // TODO: 优化成 drag start 时触发

        // 订阅
    }

    private _anyDragStoped(dragRef) {

    }

    private _canEnter(dragRef): boolean {
        const accept = this._accept;
        let isAccept = false;
        if (_.isString(accept)) {
            const rootElement = dragRef.getRootElement();
            const element = dragRef.element;

            isAccept = isElementMatchSelector(rootElement, accept) || isElementMatchSelector(element, accept);
        } else if (_.isFunction(accept)) {
            isAccept = accept(dragRef, this);
        }

        if (isAccept && this._enterPredicate && _.isFunction(this._enterPredicate)) {
            isAccept = this._enterPredicate(dragRef, this);
        }

        return isAccept;
    }

    private _removeSubscriptions() {
        if (this._subscriptions.length) {
            this._subscriptions.forEach(it => it.unsubscribe());
        }
    }
}

function isElementMatchSelector(element: HTMLElement, selector: string) {
    return element.matches ? element.matches(selector) :
        (element as any).msMatchesSelector(selector);
}