import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'np-accept',
  templateUrl: './accept.component.html',
  styleUrls: ['./accept.component.scss']
})
export class AcceptComponent implements OnInit {

  aDropTimes = 0;
  bDropTimes = 0;

  constructor() { }

  ngOnInit() {
  }

  onDroped($event, flag: 'A' | 'B') {
    const { source, target } = $event;
    // console.log('Drag dropped', source, target);
    if (flag === 'A') {
      this.aDropTimes++;
    } else if(flag === 'B') {
      this.bDropTimes++;
    }
  }
}
