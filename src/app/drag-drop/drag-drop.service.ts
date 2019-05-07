import { Injectable, Inject, NgZone, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DraggableRef, DragRefConfig } from './draggable-ref';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DraggableDirective } from './directives/draggable.directive';


const DEFAULT_CONFIG = <DragRefConfig>{
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5
};

/**
 * 将DOM元素转换成拖拽元素的辅助服务
 */
@Injectable({
    providedIn: 'root'
})
export class DragDropService {

    constructor(
        @Inject(DOCUMENT) private _document: any,
        private _ngZone: NgZone,
        private _viewportRuler: ViewportRuler,
        private _dragDropRegistry: DragDropRegistryService<DraggableRef, any>
    ) { }

    /**
     * 将元素转换为可拖动项。
     * @param element 要绑定拖动功能的元素
     */
    createDrag<T = any>(element: ElementRef<HTMLElement> | HTMLElement,
        config: DragRefConfig = DEFAULT_CONFIG): DraggableRef<T> {
        return new DraggableRef<T>(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
    }
}
