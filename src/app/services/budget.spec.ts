import { TestBed } from '@angular/core/testing';

import { Budget } from './budget';

describe('Budget', () => {
  let service: Budget;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Budget);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
