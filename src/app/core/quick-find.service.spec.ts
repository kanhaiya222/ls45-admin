import { TestBed } from '@angular/core/testing';
import { QuickFindService } from './quick-find.service';

describe('QuickFindService', () => {
  let service: QuickFindService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickFindService);
  });

  it('starts closed', () => {
    expect(service.isOpen()).toBeFalse();
  });

  it('open() and close() set the state', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    service.close();
    expect(service.isOpen()).toBeFalse();
  });

  it('toggle() flips the state', () => {
    service.toggle();
    expect(service.isOpen()).toBeTrue();
    service.toggle();
    expect(service.isOpen()).toBeFalse();
  });
});
