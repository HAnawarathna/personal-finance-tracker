import { TestBed } from '@angular/core/testing';

import { Category } from './category';

describe('Category', () => {
  let service: Category;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Category);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
