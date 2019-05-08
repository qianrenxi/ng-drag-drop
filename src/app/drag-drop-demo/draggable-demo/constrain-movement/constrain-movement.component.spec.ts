import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstrainMovementComponent } from './constrain-movement.component';

describe('ConstrainMovementComponent', () => {
  let component: ConstrainMovementComponent;
  let fixture: ComponentFixture<ConstrainMovementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConstrainMovementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstrainMovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
