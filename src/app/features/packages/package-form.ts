import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PackageAdminService } from '../../core/package-admin.service';
import {
  Category,
  CreatePackagePayload,
  PackageDetail,
  PackageDifficulty,
  Tag,
} from '../../core/models';

@Component({
  selector: 'app-admin-package-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-form.html',
  styleUrl: './package-form.scss',
})
export class PackageFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly packagesApi = inject(PackageAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly publicId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.publicId !== null;

  readonly categories = signal<Category[]>([]);
  readonly tags = signal<Tag[]>([]);
  readonly selectedTagIds = signal<string[]>([]);

  readonly loading = signal(this.isEdit);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly difficulties: PackageDifficulty[] = ['EASY', 'MODERATE', 'CHALLENGING'];
  readonly heading = computed(() => (this.isEdit ? 'Edit package' : 'New package'));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    categoryPublicId: ['', [Validators.required]],
    shortDescription: ['', [Validators.maxLength(500)]],
    description: [''],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    durationDays: [1, [Validators.required, Validators.min(1)]],
    durationNights: [0, [Validators.min(0)]],
    minGroupSize: [1, [Validators.min(1)]],
    maxGroupSize: [12, [Validators.min(1)]],
    difficulty: ['EASY' as PackageDifficulty],
    meetingLocation: [''],
    endLocation: [''],
    featured: [false],
    inclusions: [''],
    exclusions: [''],
    highlights: [''],
    metaTitle: ['', [Validators.maxLength(255)]],
    metaDescription: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.packagesApi.listCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => this.categories.set([]),
    });
    this.packagesApi.listTags().subscribe({
      next: (list) => this.tags.set(list),
      error: () => this.tags.set([]),
    });
    if (this.publicId) {
      this.packagesApi.get(this.publicId).subscribe({
        next: (pkg) => this.patch(pkg),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  private patch(pkg: PackageDetail): void {
    this.form.patchValue({
      name: pkg.name,
      slug: pkg.slug ?? '',
      categoryPublicId: pkg.categoryPublicId ?? '',
      shortDescription: pkg.shortDescription ?? '',
      description: pkg.description ?? '',
      basePrice: pkg.basePrice ?? 0,
      durationDays: pkg.durationDays,
      durationNights: pkg.durationNights,
      minGroupSize: pkg.minGroupSize ?? 1,
      maxGroupSize: pkg.maxGroupSize ?? 12,
      difficulty: pkg.difficulty ?? 'EASY',
      meetingLocation: pkg.meetingLocation ?? '',
      endLocation: pkg.endLocation ?? '',
      featured: pkg.featured,
      inclusions: (pkg.inclusions ?? []).join('\n'),
      exclusions: (pkg.exclusions ?? []).join('\n'),
      highlights: (pkg.highlights ?? []).join('\n'),
      metaTitle: pkg.metaTitle ?? '',
      metaDescription: pkg.metaDescription ?? '',
    });
    this.selectedTagIds.set(pkg.tagPublicIds ?? []);
    this.loading.set(false);
  }

  isTagSelected(id: string): boolean {
    return this.selectedTagIds().includes(id);
  }

  toggleTag(id: string): void {
    const current = this.selectedTagIds();
    this.selectedTagIds.set(
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
    );
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
    const payload = this.toPayload();
    const request$ = this.publicId
      ? this.packagesApi.update(this.publicId, payload)
      : this.packagesApi.create(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/packages');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.messageFrom(err));
      },
    });
  }

  private toPayload(): CreatePackagePayload {
    const raw = this.form.getRawValue();
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      categoryPublicId: raw.categoryPublicId,
      shortDescription: raw.shortDescription.trim() || undefined,
      description: raw.description.trim() || undefined,
      basePrice: Number(raw.basePrice),
      durationDays: Number(raw.durationDays),
      durationNights: Number(raw.durationNights),
      minGroupSize: Number(raw.minGroupSize),
      maxGroupSize: Number(raw.maxGroupSize),
      difficulty: raw.difficulty,
      meetingLocation: raw.meetingLocation.trim() || undefined,
      endLocation: raw.endLocation.trim() || undefined,
      featured: raw.featured,
      inclusions: this.lines(raw.inclusions),
      exclusions: this.lines(raw.exclusions),
      highlights: this.lines(raw.highlights),
      metaTitle: raw.metaTitle.trim() || undefined,
      metaDescription: raw.metaDescription.trim() || undefined,
      tagPublicIds: this.selectedTagIds(),
    };
  }

  private lines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Could not save the package. Please review the fields and try again.';
  }
}
