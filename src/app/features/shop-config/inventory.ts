import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryAdminService } from '../../core/inventory-admin.service';
import { ProductAdminService } from '../../core/product-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  ProductListItem,
  ProductVariant,
  StockLevel,
  StockMovement,
  Warehouse,
} from '../../core/models';

@Component({
  selector: 'app-admin-inventory',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory.html',
  styleUrl: './shop-config.scss',
})
export class InventoryPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(InventoryAdminService);
  private readonly productsApi = inject(ProductAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly movementTypes = ['INBOUND', 'ADJUSTMENT', 'OUTBOUND'];

  readonly warehouses = signal<Warehouse[]>([]);
  readonly busy = signal(false);

  // stock picker
  readonly products = signal<ProductListItem[]>([]);
  readonly variants = signal<ProductVariant[]>([]);
  readonly selectedProductId = signal('');
  readonly selectedVariantId = signal('');
  readonly levels = signal<StockLevel[]>([]);
  readonly movements = signal<StockMovement[]>([]);

  readonly warehouseForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    city: [''],
    country: [''],
  });

  readonly adjustForm = this.fb.nonNullable.group({
    warehousePublicId: ['', Validators.required],
    quantityDelta: [0, Validators.required],
    movementType: ['INBOUND', Validators.required],
    reason: [''],
  });

  constructor() {
    this.loadWarehouses();
    this.productsApi.list('ACTIVE', 0, 100).subscribe({
      next: (p) => this.products.set(p.content),
      error: () => this.products.set([]),
    });
  }

  private loadWarehouses(): void {
    this.api.listWarehouses().subscribe({
      next: (w) => this.warehouses.set(w),
      error: () => this.warehouses.set([]),
    });
  }

  warehouseName(publicId: string): string {
    return this.warehouses().find((w) => w.publicId === publicId)?.name ?? publicId;
  }

  // ── warehouses ──
  addWarehouse(): void {
    if (this.warehouseForm.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.warehouseForm.getRawValue();
    this.api
      .createWarehouse({
        name: raw.name.trim(),
        code: raw.code.trim(),
        city: raw.city.trim() || undefined,
        country: raw.country.trim().toUpperCase() || undefined,
      })
      .subscribe({
        next: () => {
          this.warehouseForm.reset({ name: '', code: '', city: '', country: '' });
          this.busy.set(false);
          this.loadWarehouses();
          this.toast.success('Warehouse added');
        },
        error: (e) => this.fail(e),
      });
  }

  toggleWarehouse(w: Warehouse): void {
    this.api.setWarehouseActive(w.publicId, !w.active).subscribe({
      next: () => this.loadWarehouses(),
      error: () => this.toast.error('Could not update the warehouse'),
    });
  }

  async deleteWarehouse(w: Warehouse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete warehouse?',
      message: `Delete "${w.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.api.deleteWarehouse(w.publicId).subscribe({
      next: () => {
        this.loadWarehouses();
        this.toast.success('Warehouse deleted');
      },
      error: () => this.toast.error('Could not delete the warehouse (it may hold stock).'),
    });
  }

  // ── stock ──
  selectProduct(publicId: string): void {
    this.selectedProductId.set(publicId);
    this.selectedVariantId.set('');
    this.variants.set([]);
    this.levels.set([]);
    this.movements.set([]);
    if (!publicId) {
      return;
    }
    this.productsApi.get(publicId).subscribe({
      next: (p) => this.variants.set(p.variants ?? []),
      error: () => this.variants.set([]),
    });
  }

  selectVariant(publicId: string): void {
    this.selectedVariantId.set(publicId);
    this.levels.set([]);
    this.movements.set([]);
    if (!publicId) {
      return;
    }
    this.loadStock();
  }

  private loadStock(): void {
    const v = this.selectedVariantId();
    this.api.stockForVariant(v).subscribe({ next: (l) => this.levels.set(l), error: () => this.levels.set([]) });
    this.api.movements(v).subscribe({
      next: (m) => this.movements.set(m.content),
      error: () => this.movements.set([]),
    });
  }

  adjust(): void {
    if (this.adjustForm.invalid || !this.selectedVariantId() || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.adjustForm.getRawValue();
    this.api
      .adjust({
        warehousePublicId: raw.warehousePublicId,
        variantPublicId: this.selectedVariantId(),
        quantityDelta: Number(raw.quantityDelta),
        movementType: raw.movementType,
        reason: raw.reason.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.adjustForm.patchValue({ quantityDelta: 0, reason: '' });
          this.busy.set(false);
          this.loadStock();
          this.toast.success('Stock adjusted');
        },
        error: (e) => this.fail(e),
      });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    const e = err as { error?: { message?: string } };
    this.toast.error(e?.error?.message ?? 'Operation failed.');
  }
}
