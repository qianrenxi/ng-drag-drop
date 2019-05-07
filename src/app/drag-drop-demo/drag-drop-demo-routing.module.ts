import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DraggableDemoComponent } from './draggable-demo/draggable-demo.component';

const routes: Routes = [
  { path: 'p1', component: DraggableDemoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DragDropDemoRoutingModule { }
