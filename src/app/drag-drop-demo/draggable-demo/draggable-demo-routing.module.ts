import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DraggableDemoComponent } from './draggable-demo.component';
import { DefaultFuncComponent } from './default-func/default-func.component';
import { ConstrainMovementComponent } from './constrain-movement/constrain-movement.component';
import { EventsComponent } from './events/events.component';
import { HandlesComponent } from './handles/handles.component';
import { RevertPositionComponent } from './revert-position/revert-position.component';

const routes: Routes = [
    {
        path: 'draggable', component: DraggableDemoComponent, children: [
            { path: '', redirectTo: 'default', pathMatch: 'full' },
            { path: 'default', component: DefaultFuncComponent },
            { path: 'constrain', component: ConstrainMovementComponent },
            { path: 'events', component: EventsComponent },
            { path: 'handles', component: HandlesComponent },
            { path: 'revert-position', component: RevertPositionComponent },
            { path: '**', redirectTo: 'default', pathMatch: 'full' }
        ]
    },

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DraggableDemoRoutingModule { }
