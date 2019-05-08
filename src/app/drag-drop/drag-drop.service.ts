import { Injectable, Inject, NgZone, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DraggableRef, DragRefConfig } from './draggable-ref';
import { DropRefConfig, DroppableRef } from './droppable-ref';


const DEFAULT_DRAG_CONFIG = <DragRefConfig>{
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5
};

const DEFAULT_DROP_CONFIG = <DropRefConfig>{
    tolerance: 'intersect'
}

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
        config: DragRefConfig = DEFAULT_DRAG_CONFIG): DraggableRef<T> {
        return new DraggableRef<T>(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
    }

    createDrop<T = any>(element: ElementRef<HTMLElement> | HTMLElement,
        config: DropRefConfig = DEFAULT_DROP_CONFIG): DroppableRef<T> {
        return new DroppableRef<T>(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
    }
}
