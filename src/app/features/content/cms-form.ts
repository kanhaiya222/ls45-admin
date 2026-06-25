import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CmsAdminService } from '../../core/cms-admin.service';
import { CmsPageDetail, CreateCmsPagePayload } from '../../core/models';

@Component({
  selector: 'app-admin-cms-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cms-form.html',
  styleUrl: './cms-form.scss',
})
export class CmsFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CmsAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly publicId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.publicId !== null;

  readonly loading = signal(this.isEdit);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly heading = computed(() => (this.isEdit ? 'Edit page' : 'New page'));

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    body: [''],
    metaTitle: ['', [Validators.maxLength(255)]],
    metaDescription: ['', [Validators.maxLength(500)]],
    canonicalUrl: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    if (this.publicId) {
      this.api.get(this.publicId).subscribe({
        next: (page) => this.patch(page),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  private patch(page: CmsPageDetail): void {
    this.form.patchValue({
      title: page.title,
      slug: page.slug ?? '',
      body: page.body ?? '',
      metaTitle: page.metaTitle ?? '',
      metaDescription: page.metaDescription ?? '',
      canonicalUrl: page.canonicalUrl ?? '',
    });
    this.loading.set(false);
  }

  submit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    const raw = this.form.getRawValue();
    const payload: CreateCmsPagePayload = {
      title: raw.title.trim(),
      slug: raw.slug.trim() || undefined,
      body: raw.body.trim() || undefined,
      metaTitle: raw.metaTitle.trim() || undefined,
      metaDescription: raw.metaDescription.trim() || undefined,
      canonicalUrl: raw.canonicalUrl.trim() || undefined,
    };
    const request$ = this.publicId
      ? this.api.update(this.publicId, payload)
      : this.api.create(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/content/pages');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.messageFrom(err));
      },
    });
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Could not save the page. Please review the fields and try again.';
  }
}
