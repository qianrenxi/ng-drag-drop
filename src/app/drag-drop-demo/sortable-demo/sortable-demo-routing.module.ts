import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SortableDemoComponent } from './sortable-demo.component';
import { DefaultComponent } from './default/default.component';
import { ConnectListsComponent } from './connect-lists/connect-lists.component';
import { AsgridComponent } from './asgrid/asgrid.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { HandleEmptyComponent } from './handle-empty/handle-empty.component';
import { FilterItemsComponent } from './filter-items/filter-items.component';
import { PortletsComponent } from './portlets/portlets.component';

const routes: Routes = [
  {
    path: 'sortable', component: SortableDemoComponent, children: [
      { path: '', redirectTo: 'default', pathMatch: 'full' },
      { path: 'default', component: DefaultComponent },
      { path: 'connect-lists', component: ConnectListsComponent },
      { path: 'asgrid', component: AsgridComponent },
      { path: 'placeholder', component: PlaceholderComponent },
      { path: 'handle-empty', component: HandleEmptyComponent },
      { path: 'filter-items', component: FilterItemsComponent },
      { path: 'portlets', component: PortletsComponent },
      { path: '**', redirectTo: 'default', pathMatch: 'full' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SortableDemoRoutingModule { }
