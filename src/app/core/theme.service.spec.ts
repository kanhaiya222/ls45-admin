import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('ls45admin.theme');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('applies a data-theme attribute on construction', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.inject(ApplicationRef).tick(); // flush the constructor effect
    expect(document.documentElement.getAttribute('data-theme')).toBe(service.theme());
  });

  it('toggle() flips the theme, re-applies the attribute and persists it', () => {
    const service = TestBed.inject(ThemeService);
    const appRef = TestBed.inject(ApplicationRef);
    appRef.tick();
    const before = service.theme();

    service.toggle();
    appRef.tick();
    const after = service.theme();

    expect(after).not.toBe(before);
    expect(document.documentElement.getAttribute('data-theme')).toBe(after);
    expect(localStorage.getItem('ls45admin.theme')).toBe(after);
  });

  it('restores a persisted theme on construction', () => {
    localStorage.setItem('ls45admin.theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });
});
