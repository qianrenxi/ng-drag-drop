import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraggableDemoComponent } from './draggable-demo.component';

describe('DraggableDemoComponent', () => {
  let component: DraggableDemoComponent;
  let fixture: ComponentFixture<DraggableDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraggableDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraggableDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
