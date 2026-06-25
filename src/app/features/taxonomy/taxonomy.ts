import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxonomyAdminService } from '../../core/taxonomy-admin.service';
import { Category, CreateCategoryPayload, CreateTagPayload, Tag } from '../../core/models';

@Component({
  selector: 'app-admin-taxonomy',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './taxonomy.html',
  styleUrl: './taxonomy.scss',
})
export class TaxonomyPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TaxonomyAdminService);

  readonly tagTypes = ['WELLNESS_THEME', 'AUDIENCE_TYPE', 'GENERAL'];

  readonly categories = signal<Category[]>([]);
  readonly tags = signal<Tag[]>([]);
  readonly loadingCats = signal(true);
  readonly loadingTags = signal(true);
  readonly savingCat = signal(false);
  readonly savingTag = signal(false);
  readonly catError = signal<string | null>(null);
  readonly tagError = signal<string | null>(null);

  readonly catForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: [''],
    description: [''],
    iconCode: [''],
    parentPublicId: [''],
    sortOrder: [0],
  });

  readonly tagForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    type: ['GENERAL'],
    slug: [''],
  });

  constructor() {
    this.loadCategories();
    this.loadTags();
  }

  loadCategories(): void {
    this.loadingCats.set(true);
    this.api.listCategories().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.loadingCats.set(false);
      },
      error: () => this.loadingCats.set(false),
    });
  }

  loadTags(): void {
    this.loadingTags.set(true);
    this.api.listTags().subscribe({
      next: (list) => {
        this.tags.set(list);
        this.loadingTags.set(false);
      },
      error: () => this.loadingTags.set(false),
    });
  }

  addCategory(): void {
    if (this.savingCat()) {
      return;
    }
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }
    this.savingCat.set(true);
    this.catError.set(null);
    const raw = this.catForm.getRawValue();
    const payload: CreateCategoryPayload = {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      description: raw.description.trim() || undefined,
      iconCode: raw.iconCode.trim() || undefined,
      parentPublicId: raw.parentPublicId || undefined,
      sortOrder: Number(raw.sortOrder),
    };
    this.api.createCategory(payload).subscribe({
      next: () => {
        this.savingCat.set(false);
        this.catForm.reset({ sortOrder: 0 });
        this.loadCategories();
      },
      error: (err: unknown) => {
        this.savingCat.set(false);
        this.catError.set(this.messageFrom(err));
      },
    });
  }

  deleteCategory(c: Category): void {
    this.api.deleteCategory(c.publicId).subscribe({
      next: () => this.categories.update((list) => list.filter((x) => x.publicId !== c.publicId)),
      error: (err: unknown) => this.catError.set(this.messageFrom(err)),
    });
  }

  addTag(): void {
    if (this.savingTag()) {
      return;
    }
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }
    this.savingTag.set(true);
    this.tagError.set(null);
    const raw = this.tagForm.getRawValue();
    const payload: CreateTagPayload = {
      name: raw.name.trim(),
      type: raw.type,
      slug: raw.slug.trim() || undefined,
    };
    this.api.createTag(payload).subscribe({
      next: () => {
        this.savingTag.set(false);
        this.tagForm.reset({ type: 'GENERAL' });
        this.loadTags();
      },
      error: (err: unknown) => {
        this.savingTag.set(false);
        this.tagError.set(this.messageFrom(err));
      },
    });
  }

  deleteTag(t: Tag): void {
    this.api.deleteTag(t.publicId).subscribe({
      next: () => this.tags.update((list) => list.filter((x) => x.publicId !== t.publicId)),
      error: (err: unknown) => this.tagError.set(this.messageFrom(err)),
    });
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Operation failed. Please try again.';
  }
}
