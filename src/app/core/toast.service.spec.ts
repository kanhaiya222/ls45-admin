import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('adds a success toast with the given text', () => {
    service.success('Saved');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].kind).toBe('success');
    expect(service.toasts()[0].text).toBe('Saved');
  });

  it('assigns a unique id per toast', () => {
    service.info('a');
    service.error('b');
    const [first, second] = service.toasts();
    expect(first.id).not.toBe(second.id);
  });

  it('dismiss removes only the matching toast', () => {
    service.info('a');
    service.info('b');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].text).toBe('b');
  });

  it('auto-dismisses a success toast after 4s', fakeAsync(() => {
    service.success('x');
    expect(service.toasts().length).toBe(1);
    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));

  it('keeps an error toast longer than a success toast', fakeAsync(() => {
    service.error('e');
    tick(4000);
    expect(service.toasts().length).toBe(1);
    tick(2000);
    expect(service.toasts().length).toBe(0);
  }));
});
