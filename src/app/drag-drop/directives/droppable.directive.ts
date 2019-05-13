import { Directive, ElementRef, Inject, ViewContainerRef, NgZone, Input, Output, EventEmitter, HostBinding, OnDestroy, ContentChildren, QueryList, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { DragDropService } from '../drag-drop.service';
import { DroppableRef, Tolerance } from '../droppable-ref';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DropActiveEvent, DropDeactiveEvent, DropReleasedEvent, DropDroppedEvent, DropEnterEvent, DropExitEvent, DropEndEvent } from '../drop-events';
import { DraggableRef } from '../draggable-ref';
import { Subject } from 'rxjs';
import { take, takeUntil, startWith, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { DraggableDirective } from './draggable.directive';

type Selector = string;

@Directive({
  selector: '[npDroppable]'
})
export class DroppableDirective implements AfterViewInit, OnDestroy {
  private _destroyed = new Subject<void>();

  _dropRef: DroppableRef<DroppableDirective>;

  @ContentChildren(DroppableDirective, { descendants: true }) childDroppables: QueryList<DroppableDirective>;

  /**
   * 控制哪些可拖动元素可被本可拖放对象接受。
   * 传 Selector 即 'string' 时，会根据 accept selector 对 drag 元素的 rootElement 进行样式选择器匹配
   * 传 方法时相当于 enterPredicate 的效果， 在 enterPredicate 之前会触发
   * 注： JQuery UI 用一个属性 `accept` 达到了 关联 和 筛选条件的双重效果。 这里为了简化参数传递，做成复用参数的形式
   */
  @Input('npDropAccept')
  accept: Selector | ((drag: DraggableDirective, drop: DroppableDirective) => boolean) = "*";
  /** 
   * 方法，用来判定当前拖拽对象是否允许放在本 Droppable 元素上, 效果同传方法到 accept
   * 在 accept 匹配之后会调用，相当于对accept的二次筛选
   */
  @Input('npDropEnterPredicate')
  enterPredicate: (drag: DraggableDirective, drop: DroppableDirective) => boolean = () => true;

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

  // TODO: rename to activated
  @Output('npDropActive') actived = new EventEmitter<DropActiveEvent>();
  @Output('npDropDeactive') deactived = new EventEmitter<DropDeactiveEvent>();
  @Output('npDropRelease') released = new EventEmitter<DropReleasedEvent>();
  @Output('npDrop') droped = new EventEmitter<DropDroppedEvent>();
  @Output('npDropEnter') entered = new EventEmitter<DropEnterEvent>();
  @Output('npDropExit') exited = new EventEmitter<DropExitEvent>();
  @Output('npDropEnd') ended = new EventEmitter<DropEndEvent>();

  // @Output('npDropActive') over = new EventEmitter<any>();

  @HostBinding('class.np-drop-active')
  get isActive(): boolean {
    return this._dropRef.isActive;
  }

  @HostBinding('class.np-drop-over')
  get isEntered(): boolean {
    return this._dropRef.entered;
  }

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

  ngAfterViewInit() {
    this._ngZone.onStable.asObservable()
      .pipe(take(1), takeUntil(this._destroyed))
      .subscribe(() => {
        this.childDroppables.changes.pipe(
          startWith(this.childDroppables),
          tap((children: QueryList<DroppableDirective>) => {
            const dropRefs = children
              .filter(it => it !== this)
              .map(it => it._dropRef);
            this._dropRef.withChildDroppables(dropRefs);
          }),
          takeUntil(this._destroyed)
        ).subscribe();
      });
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
    this._dropRef.despose();
  }

  private _syncInputs(ref: DroppableRef) {
    ref.enterPredicate = (dragRef: DraggableRef, dropRef: DroppableRef) => {
      return this.enterPredicate(dragRef.instance, dropRef.instance);
    }

    ref.beforeStarted$.subscribe(() => {
      if (_.isFunction(this.accept)) {
        const accept = (dragRef: DraggableRef, dropRef: DroppableRef) => {
          return _.isFunction(this.accept) && this.accept.call(dragRef.instance, dropRef.instance);
        };
        ref.withAccept(accept);
      } else {
        ref.withAccept(this.accept);
      }

      ref.disabled = this.disabled;
      ref.greedy = coerceBooleanProperty(this.greedy);
      ref.scope = this.scope;
      ref.tolerance = this.tolerance;
    });
  }

  private _handleEvents(ref: DroppableRef) {
    ref.actived$.subscribe((event: any) => {
      // console.log('active');
      this.actived.emit({
        source: event.source.instance,
        target: this
      });
    });
    ref.deactived$.subscribe((event) => {
      // console.log('deactive');
      this.deactived.emit()
    });
    ref.entered$.subscribe((event: any) => {
      // console.log('enter');
      this.entered.emit({
        source: event.source.instance,
        target: this
      })
    });
    ref.exited$.subscribe((event: any) => {
      // console.log('exit');
      this.exited.emit({
        source: event.source.instance,
        target: this
      });
    });
    ref.released$.subscribe((event: any) => {
      // console.log('release');
      this.released.emit({
        source: event.source.instance,
        target: this
      });
    });
    ref.droped$.subscribe((event: any) => {
      // console.log('drop');
      this.droped.emit({
        source: event.source.instance,
        target: this
      });
    });
    ref.ended$.subscribe((event: any) => {
      // console.log('end');
      this.ended.emit({
        source: event.source.instance,
        target: this
      });
    });
  }

}
