import { Component, OnInit } from '@angular/core';
import { moveItemInArray } from 'src/app/drag-drop/drag-utils';

@Component({
  selector: 'np-connect-lists',
  templateUrl: './connect-lists.component.html',
  styleUrls: ['./connect-lists.component.scss']
})
export class ConnectListsComponent implements OnInit {

  list1 = [];
  list2 = [];

  constructor() { }

  ngOnInit() {
    for (let index = 0; index < 8; index++) {
      this.list1.push(`Item ${index} of list 1`);
      this.list2.push(`Item ${index} of list 2`);
    }
  }

  onList1Drop($event) {
    const { currentIndex, previousIndex } = $event;
    moveItemInArray(this.list1, previousIndex, currentIndex);
  }

  onList2Drop($event) {
    const { currentIndex, previousIndex } = $event;
    moveItemInArray(this.list2, previousIndex, currentIndex);
  }
}
