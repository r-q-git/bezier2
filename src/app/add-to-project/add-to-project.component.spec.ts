import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToProjectComponent } from './add-to-project.component';

describe('AddToProjectComponent', () => {
  let component: AddToProjectComponent;
  let fixture: ComponentFixture<AddToProjectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddToProjectComponent]
    });
    fixture = TestBed.createComponent(AddToProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
