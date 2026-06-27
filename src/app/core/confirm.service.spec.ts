import { TestBed } from '@angular/core/testing';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmService);
  });

  it('ask() exposes the pending request', () => {
    void service.ask({ title: 'Archive this?', danger: true });
    expect(service.pending()?.title).toBe('Archive this?');
    expect(service.pending()?.danger).toBeTrue();
  });

  it('resolves true and clears pending on respond(true)', async () => {
    const result = service.ask({ title: 'X' });
    service.respond(true);
    await expectAsync(result).toBeResolvedTo(true);
    expect(service.pending()).toBeNull();
  });

  it('resolves false on respond(false)', async () => {
    const result = service.ask({ title: 'Y' });
    service.respond(false);
    await expectAsync(result).toBeResolvedTo(false);
    expect(service.pending()).toBeNull();
  });

  it('respond() with no pending request is a no-op', () => {
    expect(() => service.respond(true)).not.toThrow();
    expect(service.pending()).toBeNull();
  });
});
