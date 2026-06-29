import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CollectionAdminService } from '../../core/collection-admin.service';
import { ProductAdminService } from '../../core/product-admin.service';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload';
import { ToastService } from '../../core/toast.service';
import {
  AdminCollectionDetail,
  CreateCollectionPayload,
  ProductListItem,
} from '../../core/models';

@Component({
  selector: 'app-admin-collection-form',
  imports: [ReactiveFormsModule, RouterLink, ImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-form.html',
  styleUrl: './collection-form.scss',
})
export class CollectionFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CollectionAdminService);
  private readonly productsApi = inject(ProductAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private publicId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(this.publicId !== null);
  readonly heading = computed(() => (this.isEdit() ? 'Edit collection' : 'New collection'));

  readonly loading = signal(this.publicId !== null);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly members = signal<ProductListItem[]>([]);
  readonly available = signal<ProductListItem[]>([]);
  readonly selectedProductId = signal('');
  readonly busyProducts = signal(false);

  readonly selectable = computed(() => {
    const memberIds = new Set(this.members().map((m) => m.publicId));
    return this.available().filter((p) => !memberIds.has(p.publicId));
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    description: [''],
    sortOrder: [0],
    heroImageUrl: ['', [Validators.maxLength(500)]],
    thumbnailUrl: ['', [Validators.maxLength(500)]],
    metaTitle: ['', [Validators.maxLength(255)]],
    metaDescription: ['', [Validators.maxLength(500)]],
    canonicalUrl: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    if (this.publicId) {
      this.api.get(this.publicId).subscribe({
        next: (c) => this.patch(c),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
      this.productsApi.list('ACTIVE', 0, 100).subscribe({
        next: (p) => this.available.set(p.content),
        error: () => this.available.set([]),
      });
    }
  }

  private patch(c: AdminCollectionDetail): void {
    this.form.patchValue({
      name: c.name,
      slug: c.slug ?? '',
      description: c.description ?? '',
      sortOrder: c.sortOrder ?? 0,
      heroImageUrl: c.heroImageUrl ?? '',
      thumbnailUrl: c.thumbnailUrl ?? '',
      metaTitle: c.metaTitle ?? '',
      metaDescription: c.metaDescription ?? '',
      canonicalUrl: c.canonicalUrl ?? '',
    });
    this.members.set(c.products ?? []);
    this.loading.set(false);
  }

  private reloadMembers(): void {
    if (!this.publicId) {
      return;
    }
    this.api.get(this.publicId).subscribe({
      next: (c) => this.members.set(c.products ?? []),
      error: () => undefined,
    });
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
    const payload: CreateCollectionPayload = {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      description: raw.description.trim() || undefined,
      sortOrder: Number(raw.sortOrder),
      heroImageUrl: raw.heroImageUrl.trim() || undefined,
      thumbnailUrl: raw.thumbnailUrl.trim() || undefined,
      metaTitle: raw.metaTitle.trim() || undefined,
      metaDescription: raw.metaDescription.trim() || undefined,
      canonicalUrl: raw.canonicalUrl.trim() || undefined,
    };
    const req$ = this.publicId ? this.api.update(this.publicId, payload) : this.api.create(payload);
    req$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.publicId) {
          this.toast.success('Collection saved');
          this.router.navigateByUrl('/collections');
        } else {
          this.toast.success('Collection created — add products below');
          this.router.navigate(['/collections', saved.publicId, 'edit']);
        }
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const e = err as { error?: { message?: string } };
        this.saveError.set(e?.error?.message ?? 'Could not save the collection.');
      },
    });
  }

  addProduct(): void {
    const id = this.selectedProductId();
    if (!id || !this.publicId || this.busyProducts()) {
      return;
    }
    this.busyProducts.set(true);
    this.api.addProduct(this.publicId, id, this.members().length).subscribe({
      next: () => {
        this.selectedProductId.set('');
        this.busyProducts.set(false);
        this.reloadMembers();
      },
      error: () => {
        this.busyProducts.set(false);
        this.toast.error('Could not add the product');
      },
    });
  }

  removeProduct(p: ProductListItem): void {
    if (!this.publicId || this.busyProducts()) {
      return;
    }
    this.busyProducts.set(true);
    this.api.removeProduct(this.publicId, p.publicId).subscribe({
      next: () => {
        this.members.update((list) => list.filter((x) => x.publicId !== p.publicId));
        this.busyProducts.set(false);
      },
      error: () => {
        this.busyProducts.set(false);
        this.toast.error('Could not remove the product');
      },
    });
  }
}
