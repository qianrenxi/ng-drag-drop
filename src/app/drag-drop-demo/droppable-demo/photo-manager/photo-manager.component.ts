import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'np-photo-manager',
  templateUrl: './photo-manager.component.html',
  styleUrls: ['./photo-manager.component.scss']
})
export class PhotoManagerComponent implements OnInit {

  photos = [
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras1_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras1_min.jpg'
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras2_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras2_min.jpg'
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras3_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras3_min.jpg'
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras4_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras4_min.jpg'
    },
  ]

  constructor() { }

  ngOnInit() {
  }

}
