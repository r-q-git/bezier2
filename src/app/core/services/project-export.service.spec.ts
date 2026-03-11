import { TestBed } from '@angular/core/testing';

import { ProjectExportService } from './project-export.service';

describe('ProjectExportService', () => {
  let service: ProjectExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
