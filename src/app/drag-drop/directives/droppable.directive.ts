import { Directive, ElementRef, Inject, ViewContainerRef, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { DragDropService } from '../drag-drop.service';
import { DroppableRef, Tolerance } from '../droppable-ref';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DropActiveEvent, DropDeactiveEvent, DropReleasedEvent, DropDroppedEvent, DropEnterEvent, DropExitEvent, DropEndEvent } from '../drop-events';

type Selector = string;

@Directive({
  selector: '[npDroppable]'
})
export class DroppableDirective {

  _dropRef: DroppableRef<DroppableDirective>;

  /**
   * 控制哪些可拖动元素可被本可拖放对象接受。
   * 传 Selector 即 'string' 时，会根据 accept selector 对 drag 元素的 rootElement 进行样式选择器匹配
   * 传 方法时相当于 enterPredicate 的效果， 在 enterPredicate 之前会触发
   * 注： JQuery UI 用一个属性 `accept` 达到了 关联 和 筛选条件的双重效果。 这里为了简化参数传递，做成复用参数的形式
   */
  @Input('npDropAccept')
  accept: Selector | ((drag, drop) => boolean) = "*";
  /** 
   * 方法，用来判定当前拖拽对象是否允许放在本 Droppable 元素上, 效果同传方法到 accept
   * 在 accept 匹配之后会调用，相当于对accept的二次筛选
   */
  @Input('npDropEnterPredicate')
  enterPredicate: (drag, drop) => boolean = () => true;

  @Input('npDropDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._dropRef.disabled = this._disabled;
  }
  private _disabled = false;

  /** 是否抢占拖拽资源，用于拖放元素重叠的情况 */
  @Input('npDropGreedy') greedy: boolean = false;

  @Input('npDropScope') scope: string;

  @Input('npDropTolerance') tolerance: Tolerance = 'intersect';

  @Output('npDropActive') actived = new EventEmitter<DropActiveEvent>();
  @Output('npDropActive') deactived = new EventEmitter<DropDeactiveEvent>();
  @Output('npDropActive') released = new EventEmitter<DropReleasedEvent>();
  @Output('npDropActive') droped = new EventEmitter<DropDroppedEvent>();
  @Output('npDropActive') entered = new EventEmitter<DropEnterEvent>();
  @Output('npDropActive') exited = new EventEmitter<DropExitEvent>();
  @Output('npDropActive') ended = new EventEmitter<DropEndEvent>();
  
  // @Output('npDropActive') over = new EventEmitter<any>();

  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document: Document,
    private _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    dragDrop: DragDropService
  ) {
    const dropRef = this._dropRef = dragDrop.createDrop<DroppableDirective>(element);

    dropRef.instance = this;
    this._syncInputs(dropRef);
    this._handleEvents(dropRef);
  }

  private _syncInputs(ref: DroppableRef){

  }

  private _handleEvents(ref: DroppableRef){

  }

}
