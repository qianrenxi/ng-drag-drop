import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule } from '../../drag-drop/drag-drop.module';
import { SortableDemoRoutingModule } from './sortable-demo-routing.module';
import { SortableDemoComponent } from './sortable-demo.component';
import { DefaultComponent } from './default/default.component';

@NgModule({
  declarations: [SortableDemoComponent, DefaultComponent],
  imports: [
    CommonModule,
    SortableDemoRoutingModule,
    DragDropModule,
  ]
})
export class SortableDemoModule { }
