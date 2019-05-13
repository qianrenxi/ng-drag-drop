import { EmbeddedViewRef, ElementRef, NgZone, TemplateRef, ViewContainerRef } from '@angular/core';
import { coerceBooleanProperty, coerceElement } from '@angular/cdk/coercion';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { Subject, Subscription, Observable, Observer } from 'rxjs';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { toggleNativeDragInteractions, extendStyles } from './drag-styling';
import { DroppableRefInternal } from './droppable-ref';
import * as _ from 'lodash';
import { getTransformTransitionDurationInMs } from './transition-duration';

export interface DragRefConfig {
    dragStartThreshold: number;
    pointerDirectionChangeThreshold: number;
}

/** Options that can be used to bind a passive event listener. */
const passiveEventListenerOptions = normalizePassiveListenerOptions({ passive: true });

/** Options that can be used to bind an active event listener. */
const activeEventListenerOptions = normalizePassiveListenerOptions({ passive: false });

const MOUSE_EVENT_IGNORE_TIME = 800;

/** Template that can be used to create a drag helper element (e.g. a preview or a placeholder). */
export interface DragHelperTemplate<T = any> {
    template: TemplateRef<T> | null;
    viewContainer: ViewContainerRef;
    context: T;
}

/**
 * 可拖动对象引用，用来操作或销毁拖动对象
 * 泛型 T 是拖动对象挂载的数据对象类型
 */
export class DraggableRef<T = any> {
    /** 开始拖动时伴随鼠标移动的显示元素 */
    private _preview: HTMLElement;
    private _previewRef: EmbeddedViewRef<any> | null;
    private _previewTemplate?: DragHelperTemplate | null;
    private _previewRect?: ClientRect | undefined;

    private _placeholder: HTMLElement;
    private _placeholderRef: EmbeddedViewRef<any> | null;
    private _placeholderTemplate?: DragHelperTemplate | null;

    private _handles: HTMLElement[] = [];
    private _disabledHandles = new Set<HTMLElement>();

    private _rootElement: HTMLElement;

    private _boundaryElement: HTMLElement | null = null;

    /** Whether the native dragging interactions have been enabled on the root element. */
    private _nativeInteractionsEnabled = true;

    private _lastTouchEventTime: number;

    private _passiveTransform: Point = { x: 0, y: 0 };

    private _activeTransform: Point = { x: 0, y: 0 };

    private _initialTransform?: string;

    private _hasStartedDragging: boolean;

    private _hasMoved: boolean;

    private _scrollPosition: { top: number, left: number };

    private _pointerMoveSubscription: Subscription;
    private _pointerUpSubscription: Subscription;

    private _boundaryRect?: ClientRect | undefined;
    private _pickupPositionInElement: Point;
    private _pickupPositionOnPage: Point;

    private _nextSibling: Node | null;
    private _initialContainerElement: HTMLElement | null; // Node | null;

    private _moveEvents = new Subject<{
        source: DraggableRef;
        pointerPosition: { x: number, y: number };
        event: MouseEvent | TouchEvent;
        delta: { x: -1 | 0 | 1, y: -1 | 0 | 1 };
    }>();
    private _moveEventSubscriptions = 0;

    private _pointerDirectionDelta: { x: -1 | 0 | 1, y: -1 | 0 | 1 };

    private _pointerPositionAtLastDirectionChange: Point;

    /** Whether starting to drag this element is disabled. */
    get disabled(): boolean {
        return this._disabled // || !!(this._dropContainer && this._dropContainer.disabled);
    }
    set disabled(value: boolean) {
        const newValue = coerceBooleanProperty(value);

        if (newValue !== this._disabled) {
            this._disabled = newValue;
            this._toggleNativeDragInteractions();
        }
    }
    private _disabled = false;

    lockAxis: 'x' | 'y';

    _revert: boolean | 'invalid' | 'valid';

    /** 在准备拖动序列时触发 */
    beforeStarted = new Subject<void>();
    /** 在开始拖放时触发 */
    started = new Subject<{ source: DraggableRef, pointerPosition: Point }>();
    /** 在用户释放拖拽元素时触发，（在加载动画效果之前） */
    released = new Subject<{ source: DraggableRef }>();
    /** 在（容器内）完成拖动时触发 */
    ended = new Subject<{ source: DraggableRef }>();
    /** 在用户拖动元素进入一个新的容器时触发 */
    entered = new Subject<{}>();
    /** 当用户拖动元素将拖动元素从一个容器移动到另一个容器时触发 */
    exited = new Subject<{}>();
    /** 用户在一个容器中放下拖拽元素 */
    dropped = new Subject<{}>();
    /**
     * 当用户正在拖动拖拽元素时触发
     * 谨慎使用，因为用户每移动一个像素都会触发此事件
     */
    moved: Observable<{
        source: DraggableRef;
        pointerPosition: { x: number, y: number };
        event: MouseEvent | TouchEvent;
        delta: { x: -1 | 0 | 1, y: -1 | 0 | 1 };
    }> = new Observable((observer: Observer<any>) => {
        const subscription = this._moveEvents.subscribe(observer);
        this._moveEventSubscriptions++;

        return () => {
            subscription.unsubscribe();
            this._moveEventSubscriptions--;
        };
    });

    instance: T;

    // 拖放对象，在每次开始拖拽时自行清理
    private _dropedInternals = new Set<DroppableRefInternal>();

    get hasDroped(): boolean {
        return !_.isEmpty(this._dropedInternals);
    }

    constructor(
        public element: ElementRef<HTMLElement> | HTMLElement,
        private _config: DragRefConfig,
        private _document: Document,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<DraggableRef, any>
    ) {
        this.withRootElement(element);
        this._dragDropRegistry.registerDragItem(this);
    }

    isDragging(): boolean {
        return this._hasStartedDragging && this._dragDropRegistry.isDragging(this);
    }

    withRootElement(rootElement: ElementRef<HTMLElement> | HTMLElement): this {
        const element = coerceElement(rootElement);

        if (element !== this._rootElement) {
            if (this._rootElement) {
                this._removeRootElementListeners(this._rootElement);
            }

            element.addEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
            element.addEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
            this._initialTransform = undefined;
            this._rootElement = element;
        }

        return this;
    }

    withBoundaryElement(boundaryElement: ElementRef<HTMLElement> | HTMLElement | null): this {
        this._boundaryElement = boundaryElement ? coerceElement(boundaryElement) : null;
        return this;
    }

    withHandles(handles: (HTMLElement | ElementRef<HTMLElement>)[]): this {
        this._handles = handles.map(handle => coerceElement(handle));
        this._handles.forEach(handle => toggleNativeDragInteractions(handle, false));
        this._toggleNativeDragInteractions();
        return this;
    }

    withPreviewTemplate(template: DragHelperTemplate | null): this {
        this._previewTemplate = template;
        return this;
    }

    withPlaceholderTemplate(template: DragHelperTemplate | null): this {
        this._placeholderTemplate = template;
        return this;
    }

    disableHandle(handle: HTMLElement) {
        if (this._handles.indexOf(handle) > -1) {
            this._disabledHandles.add(handle);
        }
    }

    enableHandle(handle: HTMLElement) {
        this._disabledHandles.delete(handle);
    }

    /** Removes the dragging functionality from the DOM element. */
    dispose() {
        this._removeRootElementListeners(this._rootElement);

        if (this.isDragging()) {
            removeElement(this._rootElement);
        }

        this._dragDropRegistry.removeDragItem(this);
        // TODO: 

    }

    /** Resets a standalone drag item to its initial position. */
    revert() {
        this._rootElement.style.transform = this._initialTransform || '';
        this._activeTransform = { x: 0, y: 0 };
        this._passiveTransform = { x: 0, y: 0 };
    }

    getRootElement() {
        return this._rootElement;
    }

    getNextSibling(): Node | null {
        if (!this._nextSibling) {
            this._nextSibling = this._rootElement.nextSibling;
        }
        return this._nextSibling;
    }

    getPlaceholder() {
        if (!this._placeholder) {
            this._placeholder = this._createPlaceholderElement();
        }
        return this._placeholder;
    }

    drop(dropRef: DroppableRefInternal) {
        this._dropedInternals.add(dropRef);
        this.dropped.next({
            source: this,
            target: dropRef
            // allTargets: this._dropedInternals
        })
    }

    private get _dropContainer() {
        return !!this._placeholder || !!this._preview;
    }

    initDragHelpers(startContainer?: any) {
        const element = this._rootElement;

        // Grab the `nextSibling` before the preview and placeholder
        // have been created so we don't get the preview by accident.
        this._nextSibling = element.nextSibling;
        this._initialContainerElement = element.parentElement;

        const preview = this._preview = this._createPreviewElement();
        const placeholder = this._placeholder = this._createPlaceholderElement();

        element.style.display = 'none';
        this._document.body.appendChild(element.parentNode!.replaceChild(placeholder, element));
        this._document.body.appendChild(preview);
    }

    private _pointerDown = (event: MouseEvent | TouchEvent) => {
        this.beforeStarted.next();

        if (this.disabled) {
            return;
        }

        if (this._handles.length) {
            const targetHandle = this._handles.find(handle => {
                const target = event.target;
                return !!target && (target === handle || handle.contains(target as HTMLElement));
            });

            if (targetHandle && !this._disabledHandles.has(targetHandle)) {
                this._initializeDragSequence(targetHandle, event);
            }
        } else {
            this._initializeDragSequence(this._rootElement, event);
        }
    }

    private _pointerMove = (event: MouseEvent | TouchEvent) => {
        // console.log('pointer move: ', event)
        if (!this._hasStartedDragging) {
            const pointerPosition = this._getPointerPositionOnPage(event);
            const distanceX = Math.abs(pointerPosition.x - this._pickupPositionOnPage.x);
            const distanceY = Math.abs(pointerPosition.y - this._pickupPositionOnPage.y);

            if (distanceX + distanceY >= this._config.dragStartThreshold) {
                this._hasStartedDragging = true;
                this._ngZone.run(() => this._startDragSequence(event));
            }

            return;
        }

        if (this._boundaryElement) {
            if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
                this._previewRect = (this._preview || this._rootElement).getBoundingClientRect();
            }
        }

        const constrainedPointerPosition = this._getConstrainedPointerPosition(event);
        this._hasMoved = true;
        event.preventDefault();
        this._updatePointerDirectionDelta(constrainedPointerPosition);

        if (this._dropContainer) {
            this._updateActiveDropContainer(constrainedPointerPosition);
        } else {
            const activeTransform = this._activeTransform;
            activeTransform.x =
                constrainedPointerPosition.x - this._pickupPositionOnPage.x + this._passiveTransform.x;
            activeTransform.y =
                constrainedPointerPosition.y - this._pickupPositionOnPage.y + this._passiveTransform.y;
            const transform = getTransform(activeTransform.x, activeTransform.y);

            this._rootElement.style.transform = this._initialTransform ?
                transform + ' ' + this._initialTransform : transform;

            // Apply transform as attribute if dragging and svg element to work for IE
            if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
                const appliedTransform = `translate(${activeTransform.x} ${activeTransform.y})`;
                this._rootElement.setAttribute('transform', appliedTransform);
            }
        }

        if (this._moveEventSubscriptions > 0) {
            this._ngZone.run(() => {
                this._moveEvents.next({
                    source: this,
                    pointerPosition: constrainedPointerPosition,
                    event: event,
                    delta: this._pointerDirectionDelta
                });
            });
        }
    }

    private _pointerUp = (event: MouseEvent | TouchEvent) => {
        if (!this._dragDropRegistry.isDragging(this)) {
            return;
        }

        this._removeSubscriptions();
        // this._dragDropRegistry.stopDragging(this);

        // if (this._handles) {
        //     this._rootElement.style.webkitTapHighlightColor = this._rootElementTapHighlight;
        // }

        if (!this._hasStartedDragging) {
            return;
        }

        this.released.next({ source: this });
        this._dragDropRegistry.stopDragging(this);

        // TODO mark to end method
        if (!this._dropContainer) {
            this._passiveTransform.x = this._activeTransform.x;
            this._passiveTransform.y = this._activeTransform.y;

            if ((this._revert === 'invalid' && !this.hasDroped) ||
                (this._revert === 'valid' && this.hasDroped) ||
                this._revert === true) {
                this.revert();
            }

            this._ngZone.run(() => this.ended.next({ source: this }));
            this._dragDropRegistry.stopDragging(this);
            return;
        }

        this._animatePreviewToPlaceholder().then(() => {
            this._cleanupDragArtifacts(event);
            this._dragDropRegistry.stopDragging(this);
        });
    }

    private _initializeDragSequence(referenceElement: HTMLElement, event: MouseEvent | TouchEvent) {
        event.stopPropagation();
        this._dropedInternals.clear();

        const isDragging = this.isDragging();
        const isTouchSequence = isTouchEvent(event);
        const isAuxiliaryMouseButton = !isTouchSequence && (event as MouseEvent).button !== 0;
        const rootElement = this._rootElement;
        const isSyntheticEvent = !isTouchSequence && this._lastTouchEventTime &&
            this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();

        if (event.target && (event.target as HTMLElement).draggable && event.type === 'mousedown') {
            event.preventDefault();
        }

        if (isDragging || isAuxiliaryMouseButton || isSyntheticEvent) {
            return;
        }

        if (this._initialTransform == null) {
            this._initialTransform = this._rootElement.style.transform || '';
        }

        // if (this._handles.length) {
        //     this._rootElementTapHighlight = rootElement.style.webkitTapHighlightColor;
        //     rootElement.style.webkitTapHighlightColor = 'transparent';
        // }

        this._toggleNativeDragInteractions();
        this._hasStartedDragging = this._hasMoved = false;
        // this._initialContainer = this._dropContainer!;
        this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
        this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);

        this._scrollPosition = this._viewportRuler.getViewportScrollPosition();

        if (this._boundaryElement) {
            this._boundaryRect = this._boundaryElement.getBoundingClientRect();
        }

        this._pickupPositionInElement = this._previewTemplate && this._previewTemplate.template ?
            { x: 0, y: 0 } :
            this._getPointerPositionInElement(referenceElement, event);
        const pointerPosition = this._pickupPositionOnPage = this._getPointerPositionOnPage(event);
        this._pointerDirectionDelta = { x: 0, y: 0 };
        this._pointerPositionAtLastDirectionChange = { x: pointerPosition.x, y: pointerPosition.y };
        this._dragDropRegistry.startDragging(this, event);
    }

    private _startDragSequence(event: MouseEvent | TouchEvent) {
        const pointerPosition = this._getPointerPositionOnPage(event);
        this.started.next({ source: this, pointerPosition: pointerPosition });

        if (isTouchEvent(event)) {
            this._lastTouchEventTime = Date.now();
        }

        // Extract to method `initDragHelpers`, called by owner (container)
        // if (this._dropContainer) {

        // }
    }

    /** Cleans up the DOM artifacts that were added to facilitate the element being dragged. */
    private _cleanupDragArtifacts(event: MouseEvent | TouchEvent) {
        // Restore the element's visibility and insert it at its old position in the DOM.
        // It's important that we maintain the position, because moving the element around in the DOM
        // can throw off `NgFor` which does smart diffing and re-creates elements only when necessary,
        // while moving the existing elements in all other cases.
        this._rootElement.style.display = '';

        if (this._nextSibling) {
            this._nextSibling.parentNode!.insertBefore(this._rootElement, this._nextSibling);
        } else {
            // this._initialContainer.element.appendChild(this._rootElement);
            this._initialContainerElement.appendChild(this._rootElement);
        }

        this._destroyPreview();
        this._destroyPlaceholder();
        this._boundaryRect = this._previewRect = undefined;

        // Re-enter the NgZone since we bound `document` events on the outside.
        this._ngZone.run(() => {
            // const container = this._dropContainer!;
            // const currentIndex = container.getItemIndex(this);
            // const { x, y } = this._getPointerPositionOnPage(event);
            // const isPointerOverContainer = container._isOverContainer(x, y);

            this.ended.next({ source: this });
            // this.dropped.next({
            //     item: this,
            //     currentIndex,
            //     previousIndex: this._initialContainer.getItemIndex(this),
            //     container: container,
            //     previousContainer: this._initialContainer,
            //     isPointerOverContainer
            // });
            // container.drop(this, currentIndex, this._initialContainer, isPointerOverContainer);
            // this._dropContainer = this._initialContainer;
        });
    }

    /**
     * Updates the item's position in its drop container, or moves it
     * into a new one, depending on its current drag position.
     */
    private _updateActiveDropContainer({ x, y }: Point) {
        // // Drop container that draggable has been moved into.
        // let newContainer = this._dropContainer!._getSiblingContainerFromPosition(this, x, y) ||
        //     this._initialContainer._getSiblingContainerFromPosition(this, x, y);

        // // If we couldn't find a new container to move the item into, and the item has left it's
        // // initial container, check whether the it's over the initial container. This handles the
        // // case where two containers are connected one way and the user tries to undo dragging an
        // // item into a new container.
        // if (!newContainer && this._dropContainer !== this._initialContainer &&
        //     this._initialContainer._isOverContainer(x, y)) {
        //     newContainer = this._initialContainer;
        // }

        // if (newContainer && newContainer !== this._dropContainer) {
        //     this._ngZone.run(() => {
        //         // Notify the old container that the item has left.
        //         this.exited.next({ item: this, container: this._dropContainer! });
        //         this._dropContainer!.exit(this);
        //         // Notify the new container that the item has entered.
        //         this.entered.next({ item: this, container: newContainer! });
        //         this._dropContainer = newContainer!;
        //         this._dropContainer.enter(this, x, y);
        //     });
        // }

        // this._dropContainer!._sortItem(this, x, y, this._pointerDirectionDelta);
        this._preview.style.transform =
            getTransform(x - this._pickupPositionInElement.x, y - this._pickupPositionInElement.y);
    }

    /**
     * Creates the element that will be rendered next to the user's pointer
     * and will be used as a preview of the element that is being dragged.
     */
    private _createPreviewElement(): HTMLElement {
        const previewConfig = this._previewTemplate;
        const previewTemplate = previewConfig ? previewConfig.template : null;
        let preview: HTMLElement;

        if (previewTemplate) {
            const viewRef = previewConfig!.viewContainer.createEmbeddedView(previewTemplate,
                previewConfig!.context);
            preview = viewRef.rootNodes[0];
            this._previewRef = viewRef;
            preview.style.transform =
                getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
        } else {
            const element = this._rootElement;
            const elementRect = element.getBoundingClientRect();

            preview = deepCloneNode(element);
            preview.style.width = `${elementRect.width}px`;
            preview.style.height = `${elementRect.height}px`;
            preview.style.transform = getTransform(elementRect.left, elementRect.top);
        }

        extendStyles(preview.style, {
            // It's important that we disable the pointer events on the preview, because
            // it can throw off the `document.elementFromPoint` calls in the `CdkDropList`.
            pointerEvents: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '1000'
        });

        toggleNativeDragInteractions(preview, false);

        preview.classList.add('np-drag-preview');
        // preview.setAttribute('dir', this._direction);

        return preview;
    }

    /**
     * Animates the preview element from its current position to the location of the drop placeholder.
     * @returns Promise that resolves when the animation completes.
     */
    private _animatePreviewToPlaceholder(): Promise<void> {
        // If the user hasn't moved yet, the transitionend event won't fire.
        if (!this._hasMoved) {
            return Promise.resolve();
        }

        const placeholderRect = this._placeholder.getBoundingClientRect();

        // Apply the class that adds a transition to the preview.
        this._preview.classList.add('cdk-drag-animating');

        // Move the preview to the placeholder position.
        this._preview.style.transform = getTransform(placeholderRect.left, placeholderRect.top);

        // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
        // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
        // apply its style, we take advantage of the available info to figure out whether we need to
        // bind the event in the first place.
        const duration = getTransformTransitionDurationInMs(this._preview);

        if (duration === 0) {
            return Promise.resolve();
        }

        return this._ngZone.runOutsideAngular(() => {
            return new Promise(resolve => {
                const handler = ((event: TransitionEvent) => {
                    if (!event || (event.target === this._preview && event.propertyName === 'transform')) {
                        this._preview.removeEventListener('transitionend', handler);
                        resolve();
                        clearTimeout(timeout);
                    }
                }) as EventListenerOrEventListenerObject;

                // If a transition is short enough, the browser might not fire the `transitionend` event.
                // Since we know how long it's supposed to take, add a timeout with a 50% buffer that'll
                // fire if the transition hasn't completed when it was supposed to.
                const timeout = setTimeout(handler as Function, duration * 1.5);
                this._preview.addEventListener('transitionend', handler);
            });
        });
    }


    /** Creates an element that will be shown instead of the current element while dragging. */
    private _createPlaceholderElement(): HTMLElement {
        // 避免重复创建，导致对象引用不一致
        // if (this._placeholder) {
        //     return this._placeholder;
        // }

        const placeholderConfig = this._placeholderTemplate;
        const placeholderTemplate = placeholderConfig ? placeholderConfig.template : null;
        let placeholder: HTMLElement;

        if (placeholderTemplate) {
            this._placeholderRef = placeholderConfig!.viewContainer.createEmbeddedView(
                placeholderTemplate,
                placeholderConfig!.context
            );
            placeholder = this._placeholderRef.rootNodes[0];
        } else {
            placeholder = deepCloneNode(this._rootElement);
            // console.log(this._rootElement, placeholder)
        }

        placeholder.classList.add('np-drag-placeholder');
        return placeholder;
    }

    /** Destroys the preview element and its ViewRef. */
    private _destroyPreview() {
        if (this._preview) {
            removeElement(this._preview);
        }

        if (this._previewRef) {
            this._previewRef.destroy();
        }

        this._preview = this._previewRef = null!;
    }

    /** Destroys the placeholder element and its ViewRef. */
    private _destroyPlaceholder() {
        if (this._placeholder) {
            removeElement(this._placeholder);
        }

        if (this._placeholderRef) {
            this._placeholderRef.destroy();
        }

        this._placeholder = this._placeholderRef = null!;
    }

    private _getPointerPositionInElement(referenceElement: HTMLElement,
        event: MouseEvent | TouchEvent): Point {
        const elementRect = this._rootElement.getBoundingClientRect();
        const handleElement = referenceElement === this._rootElement ? null : referenceElement;
        const referenceRect = handleElement ? handleElement.getBoundingClientRect() : elementRect;
        const point = isTouchEvent(event) ? event.targetTouches[0] : event;
        const x = point.pageX - referenceRect.left - this._scrollPosition.left;
        const y = point.pageY - referenceRect.top - this._scrollPosition.top;

        return {
            x: referenceRect.left - elementRect.left + x,
            y: referenceRect.top - elementRect.top + y
        };
    }

    private _getPointerPositionOnPage(event: MouseEvent | TouchEvent): Point {
        // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
        const point = isTouchEvent(event) ? (event.touches[0] || event.changedTouches[0]) : event;

        return {
            x: point.pageX - this._scrollPosition.left,
            y: point.pageY - this._scrollPosition.top
        };
    }

    /** Gets the pointer position on the page, accounting for any position constraints. */
    private _getConstrainedPointerPosition(event: MouseEvent | TouchEvent): Point {
        const point = this._getPointerPositionOnPage(event);
        // TODO
        const dropContainerLock = null; //this._dropContainer ? this._dropContainer.lockAxis : null;

        if (this.lockAxis === 'x' || dropContainerLock === 'x') {
            point.y = this._pickupPositionOnPage.y;
        } else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
            point.x = this._pickupPositionOnPage.x;
        }

        if (this._boundaryRect) {
            const { x: pickupX, y: pickupY } = this._pickupPositionInElement;
            const boundaryRect = this._boundaryRect;
            const previewRect = this._previewRect!;
            const minY = boundaryRect.top + pickupY;
            const maxY = boundaryRect.bottom - (previewRect.height - pickupY);
            const minX = boundaryRect.left + pickupX;
            const maxX = boundaryRect.right - (previewRect.width - pickupX);

            point.x = clamp(point.x, minX, maxX);
            point.y = clamp(point.y, minY, maxY);
        }

        return point;
    }

    /** Updates the current drag delta, based on the user's current pointer position on the page. */
    private _updatePointerDirectionDelta(pointerPositionOnPage: Point) {
        const { x, y } = pointerPositionOnPage;
        const delta = this._pointerDirectionDelta;
        const positionSinceLastChange = this._pointerPositionAtLastDirectionChange;

        // Amount of pixels the user has dragged since the last time the direction changed.
        const changeX = Math.abs(x - positionSinceLastChange.x);
        const changeY = Math.abs(y - positionSinceLastChange.y);

        // Because we handle pointer events on a per-pixel basis, we don't want the delta
        // to change for every pixel, otherwise anything that depends on it can look erratic.
        // To make the delta more consistent, we track how much the user has moved since the last
        // delta change and we only update it after it has reached a certain threshold.
        if (changeX > this._config.pointerDirectionChangeThreshold) {
            delta.x = x > positionSinceLastChange.x ? 1 : -1;
            positionSinceLastChange.x = x;
        }

        if (changeY > this._config.pointerDirectionChangeThreshold) {
            delta.y = y > positionSinceLastChange.y ? 1 : -1;
            positionSinceLastChange.y = y;
        }

        return delta;
    }

    private _removeSubscriptions() {
        this._pointerMoveSubscription.unsubscribe();
        this._pointerUpSubscription.unsubscribe();
    }

    /** Toggles the native drag interactions, based on how many handles are registered. */
    private _toggleNativeDragInteractions() {
        if (!this._rootElement || !this._handles) {
            return;
        }

        const shouldEnable = this.disabled || this._handles.length > 0;

        if (shouldEnable !== this._nativeInteractionsEnabled) {
            this._nativeInteractionsEnabled = shouldEnable;
            toggleNativeDragInteractions(this._rootElement, shouldEnable);
        }
    }

    private _removeRootElementListeners(element: HTMLElement) {
        element.removeEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
        element.removeEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
    }
}


/** Point on the page or within an element. */
interface Point {
    x: number;
    y: number;
}

/**
 * Gets a 3d `transform` that can be applied to an element.
 * @param x Desired position of the element along the X axis.
 * @param y Desired position of the element along the Y axis.
 */
function getTransform(x: number, y: number): string {
    // Round the transforms since some browsers will
    // blur the elements for sub-pixel transforms.
    return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

/** Creates a deep clone of an element. */
function deepCloneNode(node: HTMLElement): HTMLElement {
    const clone = node.cloneNode(true) as HTMLElement;
    // Remove the `id` to avoid having multiple elements with the same id on the page.
    clone.removeAttribute('id');
    return clone;
}

/** Clamps a value between a minimum and a maximum. */
function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Helper to remove an element from the DOM and to do all the necessary null checks.
 * @param element Element to be removed.
 */
function removeElement(element: HTMLElement | null) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/** Determines whether an event is a touch event. */
function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
    return event.type.startsWith('touch');
}
