import { Injectable, OnDestroy, NgZone, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';

/** Event options that can be used to bind an active, capturing event. */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
    passive: false,
    capture: true
});

@Injectable({
    providedIn: 'root'
})
export class DragDropRegistryService<I, C> implements OnDestroy {

    private _document: Document;

    private _activeDragInstances = new Set<I>();

    private _globalListeners = new Map<string, {
        handler: (event: Event) => void,
        options?: AddEventListenerOptions | boolean
    }>();

    readonly pointerMove: Subject<TouchEvent | MouseEvent> = new Subject<TouchEvent | MouseEvent>();

    readonly pointerUp: Subject<TouchEvent | MouseEvent> = new Subject<TouchEvent | MouseEvent>();

    constructor(
        private _ngZone: NgZone,
        @Inject(DOCUMENT) _document: any
    ) {
        this._document = _document;
    }

    ngOnDestroy() {

    }

    isDragging(drag: I): boolean {
        return this._activeDragInstances.has(drag);
    }

    startDragging(drag: I, event: TouchEvent | MouseEvent) {
        this._activeDragInstances.add(drag);

        if (this._activeDragInstances.size === 1) {
            const isTouchEvent = event.type.startsWith('touch');
            const moveEvent = isTouchEvent ? 'touchmove' : 'mousemove';
            const upEvent = isTouchEvent ? 'touchend' : 'mouseup';

            this._globalListeners
                .set(moveEvent, {
                    handler: (e: Event) => this.pointerMove.next(e as TouchEvent | MouseEvent),
                    options: activeCapturingEventOptions
                })
                .set(upEvent, {
                    handler: (e: Event) => this.pointerUp.next(e as TouchEvent | MouseEvent),
                    options: true
                })
                .set('selectstart', {
                    handler: this._preventDefaultWhileDragging,
                    options: activeCapturingEventOptions
                });

            if (!isTouchEvent) {
                this._globalListeners.set('wheel', {
                    handler: this._preventDefaultWhileDragging,
                    options: activeCapturingEventOptions
                });
            }

            this._ngZone.runOutsideAngular(() => {
                this._globalListeners.forEach((config, name) => {
                    this._document.addEventListener(name, config.handler, config.options);
                });
            });
        }
    }

    stopDragging(drag: I) {
        this._activeDragInstances.delete(drag);

        if (this._activeDragInstances.size === 0) {
            this._clearGlobalListeners();
        }
    }

    private _preventDefaultWhileDragging = (event: Event) => {
        if (this._activeDragInstances.size) {
            event.preventDefault();
        }
    }

    private _clearGlobalListeners() {
        this._globalListeners.forEach((config, name) => {
            this._document.removeEventListener(name, config.handler, config.options);
        });

        this._globalListeners.clear();
    }
}
