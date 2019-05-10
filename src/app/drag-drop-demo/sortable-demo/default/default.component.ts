import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'np-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {

  items = [];

  constructor() { }

  ngOnInit() {
    for (let index = 0; index < 8; index++) {
      this.items.push(`Item ${index}`);
    }
  }

}
