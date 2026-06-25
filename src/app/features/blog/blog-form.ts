import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogAdminService } from '../../core/blog-admin.service';
import { BlogCategory, BlogPostDetail, CreateBlogPostPayload } from '../../core/models';

@Component({
  selector: 'app-admin-blog-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-form.html',
  styleUrl: './blog-form.scss',
})
export class BlogFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BlogAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly publicId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.publicId !== null;

  readonly categories = signal<BlogCategory[]>([]);
  readonly loading = signal(this.isEdit);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly heading = computed(() => (this.isEdit ? 'Edit post' : 'New post'));

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    categoryPublicId: [''],
    authorName: ['', [Validators.maxLength(150)]],
    excerpt: ['', [Validators.maxLength(500)]],
    body: [''],
    heroImageUrl: ['', [Validators.maxLength(500)]],
    metaTitle: ['', [Validators.maxLength(255)]],
    metaDescription: ['', [Validators.maxLength(500)]],
    canonicalUrl: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.api.listCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => this.categories.set([]),
    });
    if (this.publicId) {
      this.api.getPost(this.publicId).subscribe({
        next: (post) => this.patch(post),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  private patch(post: BlogPostDetail): void {
    this.form.patchValue({
      title: post.title,
      slug: post.slug ?? '',
      categoryPublicId: post.categoryPublicId ?? '',
      authorName: post.authorName ?? '',
      excerpt: post.excerpt ?? '',
      body: post.body ?? '',
      heroImageUrl: post.heroImageUrl ?? '',
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      canonicalUrl: post.canonicalUrl ?? '',
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
    const payload: CreateBlogPostPayload = {
      title: raw.title.trim(),
      slug: raw.slug.trim() || undefined,
      categoryPublicId: raw.categoryPublicId || undefined,
      authorName: raw.authorName.trim() || undefined,
      excerpt: raw.excerpt.trim() || undefined,
      body: raw.body.trim() || undefined,
      heroImageUrl: raw.heroImageUrl.trim() || undefined,
      metaTitle: raw.metaTitle.trim() || undefined,
      metaDescription: raw.metaDescription.trim() || undefined,
      canonicalUrl: raw.canonicalUrl.trim() || undefined,
    };
    const request$ = this.publicId
      ? this.api.updatePost(this.publicId, payload)
      : this.api.createPost(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/content/blog');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.messageFrom(err));
      },
    });
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Could not save the post. Please review the fields and try again.';
  }
}
