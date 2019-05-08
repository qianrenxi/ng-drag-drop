import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DroppableDemoComponent } from './droppable-demo.component';
import { DragDropModule } from '../../drag-drop/drag-drop.module';
import { DroppableDemoRoutingModule } from './doppable-demo-routing.module';
import { DefaultComponent } from './default/default.component';
import { AcceptComponent } from './accept/accept.component';
import { PropagationComponent } from './propagation/propagation.component';
import { RevertComponent } from './revert/revert.component';
import { PhotoManagerComponent } from './photo-manager/photo-manager.component';
import { VisualFeedbackComponent } from './visual-feedback/visual-feedback.component';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    DroppableDemoRoutingModule,
  ],
  declarations: [
    DroppableDemoComponent,
    DefaultComponent,
    AcceptComponent,
    PropagationComponent,
    RevertComponent,
    PhotoManagerComponent,
    VisualFeedbackComponent,
  ],
})
export class DroppableDemoModule { }
