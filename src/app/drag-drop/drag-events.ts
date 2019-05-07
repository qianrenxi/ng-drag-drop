import { DraggableDirective } from './directives/draggable.directive';

export interface DragStartEvent<T = any> {
    source: DraggableDirective<T>;
}

export interface DragReleaseEvent<T = any> {
    source: DraggableDirective<T>;
}

export interface DragEndEvent<T = any> {
    source: DraggableDirective<T>;
}

export interface DragEnterEvent<T = any, I = T> {
    container: any;

    item: DraggableDirective<I>;
}

export interface DragExitEvent<T = any, I = T> {
    container: any;

    item: DraggableDirective<I>;
}

export interface DragDropEvent<T = any, O = T> {
    previousIndex: number;
    currentIndex: number;
    item: DraggableDirective;
    container: any;
    previousContainer: any;
    isPointerOverContainer: boolean;
}

export interface DragMoveEvent<T = any> {
    source: DraggableDirective<T>;
    pointerPosition: { x: number, y: number };
    event: MouseEvent | TouchEvent;
    delta: { x: -1 | 0 | 1, y: -1 | 0 | 1 };
}

export interface DragSortEvent<T = any, I = T> {
    previousIndex: number;
    currentIndex: number;
    container: any;
    item: DraggableDirective<I>;
}