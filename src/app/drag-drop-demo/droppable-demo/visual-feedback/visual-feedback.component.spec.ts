import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualFeedbackComponent } from './visual-feedback.component';

describe('VisualFeedbackComponent', () => {
  let component: VisualFeedbackComponent;
  let fixture: ComponentFixture<VisualFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisualFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
