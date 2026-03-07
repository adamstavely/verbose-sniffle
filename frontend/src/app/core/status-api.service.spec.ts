import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StatusApiService } from './status-api.service';

describe('StatusApiService', () => {
  let service: StatusApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatusApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(StatusApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return observable from getSummary', () => {
    service.getSummary().subscribe((data) => {
      expect(data).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.coreServices).toBeDefined();
    });
  });
});
