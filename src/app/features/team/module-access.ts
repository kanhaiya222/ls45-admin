import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Role } from '../../core/models';
import { ADMIN_MODULES, AdminModule } from '../../core/modules';
import { RoleAdminService } from '../../core/role-admin.service';
import { ToastService } from '../../core/toast.service';
import { ListStateComponent } from '../../shared/list-state/list-state';
import { forkJoin } from 'rxjs';

/** Roles that always have full access and are not editable from the matrix. */
const FULL_ACCESS_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN']);

/**
 * Module Access (super-admin) — a Roles × Modules matrix. Each cell grants/revokes a module's
 * permission(s) on a role. SUPER_ADMIN / TENANT_ADMIN are shown as full-access and locked; CUSTOMER
 * is excluded. Writes go through the role-permission endpoints (which work on system roles too), so
 * staff roles like OPERATOR_STAFF / CONTENT_MANAGER can be scoped here.
 */
@Component({
  selector: 'app-module-access',
  imports: [ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './module-access.html',
  styleUrl: './module-access.scss',
})
export class ModuleAccessPage {
  private readonly api = inject(RoleAdminService);
  private readonly toast = inject(ToastService);

  readonly modules: readonly AdminModule[] = ADMIN_MODULES;
  readonly loading = signal(true);
  readonly errored = signal(false);
  /** "rolePublicId|moduleId" of the cell currently being written. */
  readonly busyCell = signal<string | null>(null);

  private readonly allRoles = signal<Role[]>([]);

  /** Editable rows: everything except CUSTOMER and the locked full-access admins. */
  readonly rows = computed(() =>
    this.allRoles().filter((r) => r.name !== 'CUSTOMER' && !FULL_ACCESS_ROLES.has(r.name)),
  );
  /** Locked rows shown for context (full access). */
  readonly lockedRows = computed(() => this.allRoles().filter((r) => FULL_ACCESS_ROLES.has(r.name)));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.api.listRoles().subscribe({
      next: (roles) => {
        this.allRoles.set(roles);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  hasModule(role: Role, mod: AdminModule): boolean {
    return role.permissionCodes.includes(mod.permission);
  }

  cellKey(role: Role, mod: AdminModule): string {
    return `${role.publicId}|${mod.id}`;
  }

  isBusy(role: Role, mod: AdminModule): boolean {
    return this.busyCell() === this.cellKey(role, mod);
  }

  toggle(role: Role, mod: AdminModule): void {
    if (this.busyCell()) {
      return;
    }
    const key = this.cellKey(role, mod);
    this.busyCell.set(key);
    const currentlyOn = this.hasModule(role, mod);

    const done = (codes: string[], granted: boolean) => {
      this.patchRole(role.publicId, codes, granted);
      this.busyCell.set(null);
      this.toast.success(`${granted ? 'Granted' : 'Revoked'} ${mod.label} for ${this.label(role.name)}`);
    };
    const fail = (err: unknown) => {
      this.busyCell.set(null);
      const e = err as { error?: { message?: string } };
      this.toast.error(e?.error?.message ?? 'Could not update access. Please try again.');
    };

    if (currentlyOn) {
      // Revoke every code the module grants.
      forkJoin(mod.grantCodes.map((c) => this.api.removePermission(role.publicId, c))).subscribe({
        next: () => done([...mod.grantCodes], false),
        error: fail,
      });
    } else {
      this.api.assignPermissions(role.publicId, mod.grantCodes).subscribe({
        next: () => done([...mod.grantCodes], true),
        error: fail,
      });
    }
  }

  private patchRole(publicId: string, codes: string[], granted: boolean): void {
    this.allRoles.update((list) =>
      list.map((r) => {
        if (r.publicId !== publicId) {
          return r;
        }
        const set = new Set(r.permissionCodes);
        codes.forEach((c) => (granted ? set.add(c) : set.delete(c)));
        return { ...r, permissionCodes: [...set] };
      }),
    );
  }

  label(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
