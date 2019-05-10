import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SortableDemoComponent } from './sortable-demo.component';
import { DefaultComponent } from './default/default.component';

const routes: Routes = [
  {
    path: 'sortable', component: SortableDemoComponent, children: [
      { path: '', redirectTo: 'default', pathMatch: 'full' },
      { path: 'default', component: DefaultComponent },
      { path: '**', redirectTo: 'default', pathMatch: 'full' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SortableDemoRoutingModule { }
