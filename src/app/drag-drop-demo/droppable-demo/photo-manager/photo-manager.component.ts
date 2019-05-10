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
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras.jpg',
      isDeleted: false,
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras2_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras.jpg',
      isDeleted: false,
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras3_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras.jpg',
      isDeleted: false,
    },
    {
      title: 'Demo 1',
      thumbnail: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras4_min.jpg',
      imgUrl: 'https://jqueryui.com/resources/demos/droppable/images/high_tatras.jpg',
      isDeleted: true,
    },
  ]

  get gallery(): any[] {
    return this.photos.filter(it => !it.isDeleted);
  }

  get trashed(): any[] {
    return this.photos.filter(it => it.isDeleted);
  }

  constructor() { }

  ngOnInit() {
  }

  onTrashDrop(event) {
    const { source } = event;
    const { dragData } = source;
    if (!!dragData) {
      this.delete(dragData)
    }
  }

  onGalleryDrop(event) {
    const { source } = event;
    const { dragData } = source;
    if (!!dragData) {
      this.recycle(dragData)
    }
  }

  delete(item) {
    item.isDeleted = true;
  }

  recycle(item) {
    item.isDeleted = false;
  }
}
