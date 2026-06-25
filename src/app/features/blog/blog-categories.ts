import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogAdminService } from '../../core/blog-admin.service';
import { BlogCategory, CreateBlogCategoryPayload } from '../../core/models';

@Component({
  selector: 'app-admin-blog-categories',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-categories.html',
  styleUrl: './blog-categories.scss',
})
export class BlogCategoriesPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BlogAdminService);

  readonly categories = signal<BlogCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    slug: [''],
    description: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listCategories().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const payload: CreateBlogCategoryPayload = {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      description: raw.description.trim() || undefined,
    };
    this.api.createCategory(payload).subscribe({
      next: (created) => {
        this.categories.update((list) => [...list, created]);
        this.saving.set(false);
        this.form.reset();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.messageFrom(err));
      },
    });
  }

  remove(c: BlogCategory): void {
    this.api.deleteCategory(c.publicId).subscribe({
      next: () => this.categories.update((list) => list.filter((x) => x.publicId !== c.publicId)),
      error: (err: unknown) => this.error.set(this.messageFrom(err)),
    });
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Operation failed. Please try again.';
  }
}
