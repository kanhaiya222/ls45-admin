import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListStateComponent } from './list-state';

@Component({
  imports: [ListStateComponent],
  template: `
    <app-list-state
      [loading]="loading"
      [error]="error"
      [empty]="empty"
      errorTitle="Boom"
      emptyTitle="Nothing here"
      [skeletonRows]="3">
      <p class="projected">CONTENT</p>
    </app-list-state>
  `,
})
class HostComponent {
  loading = false;
  error = false;
  empty = false;
}

describe('ListStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('renders the skeleton (with the requested row count) when loading', () => {
    host.loading = true;
    fixture.detectChanges();
    expect(el().querySelectorAll('.sk-row').length).toBe(3);
    expect(el().querySelector('.projected')).toBeNull();
  });

  it('renders the error state with the given title', () => {
    host.error = true;
    fixture.detectChanges();
    expect(el().querySelector('.state--error')).toBeTruthy();
    expect(el().textContent).toContain('Boom');
  });

  it('renders the empty state with the given title', () => {
    host.empty = true;
    fixture.detectChanges();
    expect(el().querySelector('.state')).toBeTruthy();
    expect(el().textContent).toContain('Nothing here');
  });

  it('projects content when not loading, error or empty', () => {
    fixture.detectChanges();
    expect(el().querySelector('.projected')).toBeTruthy();
    expect(el().textContent).toContain('CONTENT');
  });
});
