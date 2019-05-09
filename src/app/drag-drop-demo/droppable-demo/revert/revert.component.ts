import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'np-revert',
  templateUrl: './revert.component.html',
  styleUrls: ['./revert.component.scss']
})
export class RevertComponent implements OnInit {

  dropTimes = 0;

  constructor() { }

  ngOnInit() {
  }

  onDroped($event) {
    const { source, target } = $event;
    // console.log('Drag dropped', source, target);
    this.dropTimes++;
  }

}
