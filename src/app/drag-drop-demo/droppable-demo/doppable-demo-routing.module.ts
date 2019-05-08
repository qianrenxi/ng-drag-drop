import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DroppableDemoComponent } from './droppable-demo.component';
import { DefaultComponent } from './default/default.component';
import { AcceptComponent } from './accept/accept.component';
import { PropagationComponent } from './propagation/propagation.component';
import { RevertComponent } from './revert/revert.component';
import { PhotoManagerComponent } from './photo-manager/photo-manager.component';
import { VisualFeedbackComponent } from './visual-feedback/visual-feedback.component';

const routes: Routes = [
    {
        path: 'droppable', component: DroppableDemoComponent, children: [
            { path: '', redirectTo: 'default', pathMatch: 'full' },
            { path: 'default', component: DefaultComponent },
            { path: 'accept', component: AcceptComponent },
            { path: 'propagation', component: PropagationComponent },
            { path: 'revert', component: RevertComponent },
            { path: 'photo-manager', component: PhotoManagerComponent },
            { path: 'visual-feedback', component: VisualFeedbackComponent },
            { path: '**', redirectTo: 'default', pathMatch: 'full' },
        ]
    },

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DroppableDemoRoutingModule { }
