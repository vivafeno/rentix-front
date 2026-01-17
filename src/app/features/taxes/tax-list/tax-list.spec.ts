import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxList } from './tax-list';

describe('TaxList', () => {
  let component: TaxList;
  let fixture: ComponentFixture<TaxList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
