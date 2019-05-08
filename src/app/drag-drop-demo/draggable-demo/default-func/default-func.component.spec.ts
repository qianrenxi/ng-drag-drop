import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultFuncComponent } from './default-func.component';

describe('DefaultFuncComponent', () => {
  let component: DefaultFuncComponent;
  let fixture: ComponentFixture<DefaultFuncComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefaultFuncComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultFuncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
