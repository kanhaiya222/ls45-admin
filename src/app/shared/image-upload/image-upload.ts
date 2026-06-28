import { ChangeDetectionStrategy, Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImageUploadService } from '../../core/image-upload.service';
import { ToastService } from '../../core/toast.service';

/**
 * Reusable image field: a "Browse" button that uploads the chosen file and stores the returned
 * public URL — no pasting URLs. Implements ControlValueAccessor so it drops into reactive forms via
 * `<app-image-upload formControlName="heroImageUrl">`. Shows a live preview + a Remove action.
 */
@Component({
  selector: 'app-image-upload',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
})
export class ImageUploadComponent implements ControlValueAccessor {
  private readonly uploads = inject(ImageUploadService);
  private readonly toast = inject(ToastService);

  /** Short helper text under the control (e.g. "Square, ≥ 600px"). */
  readonly hint = input<string>('');

  readonly value = signal<string>('');
  readonly uploading = signal(false);
  readonly disabled = signal(false);

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  // ── ControlValueAccessor ──
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file later
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('Image must be under 10 MB.');
      return;
    }
    this.uploading.set(true);
    this.uploads.upload(file).subscribe({
      next: (res) => {
        this.value.set(res.url);
        this.onChange(res.url);
        this.onTouched();
        this.uploading.set(false);
        this.toast.success('Image uploaded');
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error('Could not upload the image. Please try again.');
      },
    });
  }

  remove(): void {
    this.value.set('');
    this.onChange('');
    this.onTouched();
  }
}
