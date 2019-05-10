import { Directive, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { SortableItemDirective } from './sortable-item.directive';

@Directive({
  selector: '[npSortable]'
})
export class SortableDirective implements AfterContentInit {

  @ContentChildren(SortableItemDirective) items: QueryList<SortableItemDirective>;

  constructor() { }

  ngAfterContentInit() {
    console.log(`Found ${this.items.length} items in sortable`);
  }
}
