import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsgridComponent } from './asgrid.component';

describe('AsgridComponent', () => {
  let component: AsgridComponent;
  let fixture: ComponentFixture<AsgridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AsgridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsgridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
