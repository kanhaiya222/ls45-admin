import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PackageAdminService } from '../../core/package-admin.service';
import { ProductAdminService } from '../../core/product-admin.service';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import {
  AddMediaPayload,
  CreateFaqPayload,
  Faq,
  PackageMedia,
  ProductListItem,
  TaggedProduct,
} from '../../core/models';

@Component({
  selector: 'app-admin-package-content',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, BrandPricePipe, ImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-content.html',
  styleUrl: './package-content.scss',
})
export class PackageContentPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PackageAdminService);
  private readonly productsApi = inject(ProductAdminService);
  private readonly route = inject(ActivatedRoute);

  readonly packagePublicId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly mediaTypes = ['IMAGE', 'VIDEO'];

  readonly packageName = signal('');
  readonly faqs = signal<Faq[]>([]);
  readonly media = signal<PackageMedia[]>([]);
  readonly loadingFaqs = signal(true);
  readonly loadingMedia = signal(true);
  readonly savingFaq = signal(false);
  readonly savingMedia = signal(false);
  readonly faqError = signal<string | null>(null);
  readonly mediaError = signal<string | null>(null);

  // ── "Shop this journey": cross-sold commerce products ──
  readonly tagged = signal<TaggedProduct[]>([]);
  readonly availableProducts = signal<ProductListItem[]>([]);
  readonly selectedProductId = signal('');
  readonly savingTagged = signal(false);
  readonly taggedError = signal<string | null>(null);
  /** Searchable-dropdown state for picking a product to tag. */
  readonly productSearch = signal('');
  readonly dropdownOpen = signal(false);
  /** Active products not already tagged — the pickable options. */
  readonly selectableProducts = computed(() => {
    const taggedIds = new Set(this.tagged().map((p) => p.publicId));
    return this.availableProducts().filter((p) => !taggedIds.has(p.publicId));
  });
  /** Selectable products filtered by the typed search (name or SKU). */
  readonly filteredProducts = computed(() => {
    const q = this.productSearch().trim().toLowerCase();
    const list = this.selectableProducts();
    if (!q) {
      return list;
    }
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q),
    );
  });

  readonly faqForm = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.maxLength(500)]],
    answer: ['', [Validators.required]],
    sortOrder: [0],
    published: [true],
  });

  readonly mediaForm = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.maxLength(500)]],
    altText: [''],
    mediaType: ['IMAGE'],
    sortOrder: [0],
    primary: [false],
  });

  constructor() {
    this.api.get(this.packagePublicId).subscribe({
      next: (pkg) => {
        this.packageName.set(pkg.name);
        this.media.set(pkg.media ?? []);
        this.tagged.set(pkg.taggedProducts ?? []);
        this.loadingMedia.set(false);
      },
      error: () => this.loadingMedia.set(false),
    });
    this.productsApi.list('ACTIVE', 0, 100).subscribe({
      next: (page) => this.availableProducts.set(page.content),
      error: () => this.availableProducts.set([]),
    });
    this.loadFaqs();
  }

  // ── tagged products ───────────────────────────────────────────────────────────
  /** A keystroke in the search box re-filters and invalidates any prior pick. */
  onProductSearch(text: string): void {
    this.productSearch.set(text);
    this.selectedProductId.set('');
    this.dropdownOpen.set(true);
  }

  /** Choose a product from the dropdown. */
  pickProduct(p: ProductListItem): void {
    this.selectedProductId.set(p.publicId);
    this.productSearch.set(`${p.name} (${p.sku})`);
    this.dropdownOpen.set(false);
  }

  openDropdown(): void {
    this.dropdownOpen.set(true);
  }

  /** Defer closing so a click on a result registers before the list is hidden. */
  closeDropdownSoon(): void {
    setTimeout(() => this.dropdownOpen.set(false), 150);
  }

  addTagged(): void {
    const id = this.selectedProductId();
    if (!id || this.savingTagged() || this.tagged().some((p) => p.publicId === id)) {
      return;
    }
    const ids = [...this.tagged().map((p) => p.publicId), id];
    this.persistTagged(ids);
  }

  removeTagged(p: TaggedProduct): void {
    if (this.savingTagged()) {
      return;
    }
    const ids = this.tagged().map((t) => t.publicId).filter((x) => x !== p.publicId);
    this.persistTagged(ids);
  }

  private persistTagged(productPublicIds: string[]): void {
    this.savingTagged.set(true);
    this.taggedError.set(null);
    this.api.setTaggedProducts(this.packagePublicId, productPublicIds).subscribe({
      next: (pkg) => {
        this.tagged.set(pkg.taggedProducts ?? []);
        this.selectedProductId.set('');
        this.productSearch.set('');
        this.dropdownOpen.set(false);
        this.savingTagged.set(false);
      },
      error: (err: unknown) => {
        this.savingTagged.set(false);
        this.taggedError.set(this.messageFrom(err));
      },
    });
  }

  loadFaqs(): void {
    this.loadingFaqs.set(true);
    this.api.listFaqs(this.packagePublicId).subscribe({
      next: (list) => {
        this.faqs.set(list);
        this.loadingFaqs.set(false);
      },
      error: () => this.loadingFaqs.set(false),
    });
  }

  reloadMedia(): void {
    this.api.get(this.packagePublicId).subscribe({
      next: (pkg) => this.media.set(pkg.media ?? []),
      error: () => undefined,
    });
  }

  addFaq(): void {
    if (this.savingFaq()) {
      return;
    }
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      return;
    }
    this.savingFaq.set(true);
    this.faqError.set(null);
    const raw = this.faqForm.getRawValue();
    const payload: CreateFaqPayload = {
      question: raw.question.trim(),
      answer: raw.answer.trim(),
      sortOrder: Number(raw.sortOrder),
      published: raw.published,
    };
    this.api.addFaq(this.packagePublicId, payload).subscribe({
      next: (created) => {
        this.faqs.update((list) => [...list, created]);
        this.savingFaq.set(false);
        this.faqForm.reset({ sortOrder: 0, published: true });
      },
      error: (err: unknown) => {
        this.savingFaq.set(false);
        this.faqError.set(this.messageFrom(err));
      },
    });
  }

  deleteFaq(faq: Faq): void {
    if (!faq.publicId) {
      return;
    }
    const id = faq.publicId;
    this.api.deleteFaq(this.packagePublicId, id).subscribe({
      next: () => this.faqs.update((list) => list.filter((f) => f.publicId !== id)),
      error: (err: unknown) => this.faqError.set(this.messageFrom(err)),
    });
  }

  addMedia(): void {
    if (this.savingMedia()) {
      return;
    }
    if (this.mediaForm.invalid) {
      this.mediaForm.markAllAsTouched();
      return;
    }
    this.savingMedia.set(true);
    this.mediaError.set(null);
    const raw = this.mediaForm.getRawValue();
    const payload: AddMediaPayload = {
      url: raw.url.trim(),
      altText: raw.altText.trim() || undefined,
      mediaType: raw.mediaType,
      sortOrder: Number(raw.sortOrder),
      primary: raw.primary,
    };
    this.api.addMedia(this.packagePublicId, payload).subscribe({
      next: () => {
        this.savingMedia.set(false);
        this.mediaForm.reset({ mediaType: 'IMAGE', sortOrder: 0, primary: false });
        this.reloadMedia();
      },
      error: (err: unknown) => {
        this.savingMedia.set(false);
        this.mediaError.set(this.messageFrom(err));
      },
    });
  }

  deleteMedia(m: PackageMedia): void {
    this.api.deleteMedia(this.packagePublicId, m.publicId).subscribe({
      next: () => this.media.update((list) => list.filter((x) => x.publicId !== m.publicId)),
      error: (err: unknown) => this.mediaError.set(this.messageFrom(err)),
    });
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Operation failed. Please try again.';
  }
}
