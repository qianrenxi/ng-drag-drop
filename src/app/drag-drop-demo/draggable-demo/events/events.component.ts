import { Component, OnInit } from '@angular/core';
import { DragStartEvent, DragReleaseEvent, DragEndEvent, DragEnterEvent, DragExitEvent, DragDropEvent, DragMoveEvent } from '../../../drag-drop';

@Component({
  selector: 'np-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  startTimes: number = 0;
  moveTimes: number = 0;
  releaseTimes: number = 0;
  endTimes: number = 0;

  constructor() { }

  ngOnInit() {
  }


  onDragStarted($event: DragStartEvent) {
    // console.log('Drag started, ', $event);
    this.startTimes++;
  }

  onDragReleased($event: DragReleaseEvent) {
    // console.log('Drag released, ', $event);
    this.releaseTimes++;
  }

  onDragEnded($event: DragEndEvent) {
    // console.log('Drag ended, ', $event);
    this.endTimes++;
  }

  onDragEntered($event: DragEnterEvent) {
    // console.log('Drag entered, ', $event);
  }

  onDragExited($event: DragExitEvent) {
    // console.log('Drag exited, ', $event);
  }

  onDragDropped($event: DragDropEvent) {
    // console.log('Drag dropped, ', $event);
  }

  onDragMoved($event: DragMoveEvent) {
    // console.log('Drag moved, ', $event);
    this.moveTimes++;
  }
}
