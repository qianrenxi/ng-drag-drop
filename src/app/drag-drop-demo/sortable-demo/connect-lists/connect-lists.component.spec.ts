import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectListsComponent } from './connect-lists.component';

describe('ConnectListsComponent', () => {
  let component: ConnectListsComponent;
  let fixture: ComponentFixture<ConnectListsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectListsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
