import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RevertPositionComponent } from './revert-position.component';

describe('RevertPositionComponent', () => {
  let component: RevertPositionComponent;
  let fixture: ComponentFixture<RevertPositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RevertPositionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RevertPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
