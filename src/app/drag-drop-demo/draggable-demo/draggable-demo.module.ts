import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '../../drag-drop/drag-drop.module';
import { DraggableDemoRoutingModule } from './draggable-demo-routing.module';
import { DraggableDemoComponent } from './draggable-demo.component';
import { DefaultFuncComponent } from './default-func/default-func.component';
import { ConstrainMovementComponent } from './constrain-movement/constrain-movement.component';
import { EventsComponent } from './events/events.component';
import { HandlesComponent } from './handles/handles.component';
import { RevertPositionComponent } from './revert-position/revert-position.component';

@NgModule({
    imports: [
        CommonModule,
        DragDropModule,
        DraggableDemoRoutingModule,
    ],
    declarations: [
        DraggableDemoComponent,
        DefaultFuncComponent,
        ConstrainMovementComponent,
        EventsComponent,
        HandlesComponent,
        RevertPositionComponent,
    ],
})
export class DraggableDemoModule { }
