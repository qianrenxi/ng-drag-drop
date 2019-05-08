import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DroppableDemoComponent } from './droppable-demo.component';

describe('DroppableDemoComponent', () => {
  let component: DroppableDemoComponent;
  let fixture: ComponentFixture<DroppableDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DroppableDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DroppableDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
