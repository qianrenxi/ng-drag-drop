import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleEmptyComponent } from './handle-empty.component';

describe('HandleEmptyComponent', () => {
  let component: HandleEmptyComponent;
  let fixture: ComponentFixture<HandleEmptyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandleEmptyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleEmptyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
