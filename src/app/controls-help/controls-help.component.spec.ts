import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlsHelpComponent } from './controls-help.component';

describe('ControlsHelpComponent', () => {
  let component: ControlsHelpComponent;
  let fixture: ComponentFixture<ControlsHelpComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ControlsHelpComponent]
    });
    fixture = TestBed.createComponent(ControlsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
