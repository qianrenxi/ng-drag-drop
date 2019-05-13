import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule } from '../../drag-drop/drag-drop.module';
import { SortableDemoRoutingModule } from './sortable-demo-routing.module';
import { SortableDemoComponent } from './sortable-demo.component';
import { DefaultComponent } from './default/default.component';
import { ConnectListsComponent } from './connect-lists/connect-lists.component';
import { AsgridComponent } from './asgrid/asgrid.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { HandleEmptyComponent } from './handle-empty/handle-empty.component';
import { FilterItemsComponent } from './filter-items/filter-items.component';
import { PortletsComponent } from './portlets/portlets.component';

@NgModule({
  declarations: [SortableDemoComponent, DefaultComponent, ConnectListsComponent, AsgridComponent, PlaceholderComponent, HandleEmptyComponent, FilterItemsComponent, PortletsComponent],
  imports: [
    CommonModule,
    SortableDemoRoutingModule,
    DragDropModule,
  ]
})
export class SortableDemoModule { }
