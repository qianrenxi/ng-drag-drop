import { Component, OnInit } from '@angular/core';
import { DragStartEvent, DragReleaseEvent, DragEndEvent, DragEnterEvent, DragExitEvent, DragDropEvent, DragMoveEvent } from '../../drag-drop';

@Component({
  selector: 'np-draggable-demo',
  templateUrl: './draggable-demo.component.html',
  styleUrls: ['./draggable-demo.component.scss']
})
export class DraggableDemoComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onDragStarted($event: DragStartEvent) {
    console.log('Drag started, ', $event);
  }

  onDragReleased($event: DragReleaseEvent) {
    console.log('Drag released, ', $event);
  }

  onDragEnded($event: DragEndEvent) {
    console.log('Drag ended, ', $event);
  }

  onDragEntered($event: DragEnterEvent) {
    console.log('Drag entered, ', $event);
  }

  onDragExited($event: DragExitEvent) {
    console.log('Drag exited, ', $event);
  }

  onDragDropped($event: DragDropEvent) {
    console.log('Drag dropped, ', $event);
  }

  onDragMoved($event: DragMoveEvent) {
    console.log('Drag moved, ', $event);
  }

}
