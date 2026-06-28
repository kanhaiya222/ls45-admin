import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload';
import { ProductAdminService } from '../../core/product-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  AddProductVariantPayload,
  CreateProductPayload,
  ProductDetail,
  ProductVariant,
} from '../../core/models';

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink, ImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly productsApi = inject(ProductAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  private publicId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(this.publicId !== null);

  readonly loading = signal(this.publicId !== null);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly variants = signal<ProductVariant[]>([]);
  readonly addingVariant = signal(false);
  readonly variantActingId = signal<string | null>(null);

  readonly heading = computed(() => (this.isEdit() ? 'Edit product' : 'New product'));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    sku: ['', [Validators.required, Validators.maxLength(64)]],
    productType: [''],
    shortDescription: ['', [Validators.maxLength(500)]],
    description: [''],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    currencyCode: [''],
    heroImageUrl: ['', [Validators.maxLength(500)]],
    thumbnailUrl: ['', [Validators.maxLength(500)]],
    weightGrams: [0, [Validators.min(0)]],
    featured: [false],
    metaTitle: ['', [Validators.maxLength(255)]],
    metaDescription: ['', [Validators.maxLength(500)]],
    canonicalUrl: ['', [Validators.maxLength(500)]],
  });

  readonly variantForm = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(64)]],
    variantName: ['', [Validators.required, Validators.maxLength(255)]],
    attributes: [''],
    priceOverride: [null as number | null],
    weightGrams: [null as number | null],
  });

  constructor() {
    if (this.publicId) {
      this.productsApi.get(this.publicId).subscribe({
        next: (p) => this.patch(p),
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  private patch(p: ProductDetail): void {
    this.form.patchValue({
      name: p.name,
      slug: p.slug ?? '',
      sku: p.sku,
      productType: p.productType ?? '',
      shortDescription: p.shortDescription ?? '',
      description: p.description ?? '',
      basePrice: p.basePrice ?? 0,
      currencyCode: p.currencyCode ?? '',
      heroImageUrl: p.heroImageUrl ?? '',
      thumbnailUrl: p.thumbnailUrl ?? '',
      weightGrams: p.weightGrams ?? 0,
      featured: p.featured,
      metaTitle: p.metaTitle ?? '',
      metaDescription: p.metaDescription ?? '',
      canonicalUrl: p.canonicalUrl ?? '',
    });
    this.variants.set(p.variants ?? []);
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
    const payload = this.toPayload();
    const request$ = this.publicId
      ? this.productsApi.update(this.publicId, payload)
      : this.productsApi.create(payload);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (this.publicId) {
          this.toast.success('Product saved');
          this.router.navigateByUrl('/products');
        } else {
          // New product: drop into edit so variants can be added straight away.
          this.toast.success('Product created — add variants below');
          this.router.navigate(['/products', saved.publicId, 'edit']);
        }
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.messageFrom(err, 'Could not save the product.'));
      },
    });
  }

  private toPayload(): CreateProductPayload {
    const raw = this.form.getRawValue();
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      sku: raw.sku.trim(),
      productType: raw.productType.trim() || undefined,
      shortDescription: raw.shortDescription.trim() || undefined,
      description: raw.description.trim() || undefined,
      basePrice: Number(raw.basePrice),
      currencyCode: raw.currencyCode.trim() || undefined,
      heroImageUrl: raw.heroImageUrl.trim() || undefined,
      thumbnailUrl: raw.thumbnailUrl.trim() || undefined,
      weightGrams: Number(raw.weightGrams),
      featured: raw.featured,
      metaTitle: raw.metaTitle.trim() || undefined,
      metaDescription: raw.metaDescription.trim() || undefined,
      canonicalUrl: raw.canonicalUrl.trim() || undefined,
    };
  }

  // ── variants ────────────────────────────────────────────────────────────────
  addVariant(): void {
    if (!this.publicId || this.addingVariant()) {
      return;
    }
    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();
      return;
    }
    this.addingVariant.set(true);
    const raw = this.variantForm.getRawValue();
    const payload: AddProductVariantPayload = {
      sku: raw.sku.trim(),
      variantName: raw.variantName.trim(),
      attributes: raw.attributes.trim() || undefined,
      priceOverride: raw.priceOverride != null ? Number(raw.priceOverride) : undefined,
      weightGrams: raw.weightGrams != null ? Number(raw.weightGrams) : undefined,
      sortOrder: this.variants().length,
      active: true,
    };
    this.productsApi.addVariant(this.publicId, payload).subscribe({
      next: (v) => {
        this.variants.update((cur) => [...cur, v]);
        this.variantForm.reset({
          sku: '',
          variantName: '',
          attributes: '',
          priceOverride: null,
          weightGrams: null,
        });
        this.addingVariant.set(false);
        this.toast.success('Variant added');
      },
      error: (err: unknown) => {
        this.addingVariant.set(false);
        this.toast.error(this.messageFrom(err, 'Could not add the variant.'));
      },
    });
  }

  async removeVariant(v: ProductVariant): Promise<void> {
    if (!this.publicId || this.variantActingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Remove this variant?',
      message: `${v.variantName} (${v.sku}) will be removed from this product.`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.variantActingId.set(v.publicId);
    this.productsApi.deleteVariant(this.publicId, v.publicId).subscribe({
      next: () => {
        this.variants.update((cur) => cur.filter((x) => x.publicId !== v.publicId));
        this.variantActingId.set(null);
        this.toast.success('Variant removed');
      },
      error: () => {
        this.variantActingId.set(null);
        this.toast.error('Could not remove the variant');
      },
    });
  }

  private messageFrom(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? fallback;
  }
}
