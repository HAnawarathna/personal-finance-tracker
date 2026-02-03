import { TestBed } from '@angular/core/testing';

import { Transaction } from './transaction';

describe('Transaction', () => {
  let service: Transaction;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Transaction);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
