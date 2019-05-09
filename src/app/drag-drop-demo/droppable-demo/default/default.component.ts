import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'np-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {

  // cs = [];

  dropTimes = 0;

  constructor() { }

  ngOnInit() {
    // for(let i=0; i < 500; i++) {
    //   this.cs.push(i);
    // }
  }

  onDroped($event) {
    const { source, target } = $event;
    // console.log('Drag dropped', source, target);
    this.dropTimes++;
  }
}
