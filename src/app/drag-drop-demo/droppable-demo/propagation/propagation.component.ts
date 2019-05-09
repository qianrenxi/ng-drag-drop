import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'np-propagation',
  templateUrl: './propagation.component.html',
  styleUrls: ['./propagation.component.scss']
})
export class PropagationComponent implements OnInit {

  dropTimes = {
    a: 0,
    ai: 0,
    b: 0,
    bi: 0,
  };

  constructor() { }

  ngOnInit() {
  }

  onDroped($event, flag) {
    const { source, target } = $event;
    // console.log('Drag dropped', source, target);
    if (!!flag && _.has(this.dropTimes, flag)) {
      this.dropTimes[flag]++;
    }
    console.log(flag);
  }
}
