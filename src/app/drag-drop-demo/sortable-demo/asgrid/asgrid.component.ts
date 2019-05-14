import { Component, OnInit } from '@angular/core';
import { moveItemInArray } from 'src/app/drag-drop/drag-utils';

@Component({
  selector: 'np-asgrid',
  templateUrl: './asgrid.component.html',
  styleUrls: ['./asgrid.component.scss']
})
export class AsgridComponent implements OnInit {

  items = [];

  constructor() { }

  ngOnInit() {
    for (let index = 0; index < 8; index++) {
      this.items.push(`${index}`);
    }
  }

  onSortDrop($event) {
    const { currentIndex, previousIndex } = $event;
    // console.log("onSortDrop:", currentIndex, previousIndex);
    moveItemInArray(this.items, previousIndex, currentIndex);
  }
}
