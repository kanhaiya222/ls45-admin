import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateRolePayload, Permission, Role } from '../../core/models';
import { RoleAdminService } from '../../core/role-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { ListStateComponent } from '../../shared/list-state/list-state';

interface PermissionGroup {
  readonly resource: string;
  readonly permissions: Permission[];
}

/**
 * Roles & permissions. Lists roles (system roles are locked), and creates/edits custom roles via a
 * permission matrix grouped by resource. The role's granted permissions are the checked codes
 * (RESOURCE:ACTION:SCOPE).
 */
@Component({
  selector: 'app-team-roles',
  imports: [ReactiveFormsModule, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-roles.html',
  styleUrl: './team-roles.scss',
})
export class TeamRolesPage {
  private readonly api = inject(RoleAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  /** null = list view; '' = creating a new role; otherwise the publicId being edited. */
  readonly editingId = signal<string | null>(null);
  readonly selected = signal<Set<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: ['', Validators.maxLength(200)],
  });

  /** Permissions grouped by resource for a tidy matrix. */
  readonly groups = computed<PermissionGroup[]>(() => {
    const byResource = new Map<string, Permission[]>();
    for (const p of this.permissions()) {
      const list = byResource.get(p.resource) ?? [];
      list.push(p);
      byResource.set(p.resource, list);
    }
    return [...byResource.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, permissions]) => ({ resource, permissions }));
  });

  readonly isEditing = computed(() => this.editingId() !== null);
  readonly selectedCount = computed(() => this.selected().size);

  constructor() {
    this.loadRoles();
    this.api.listPermissions().subscribe({
      next: (list) => this.permissions.set(list),
      error: () => {
        /* matrix will be empty if the catalogue can't load — handled by the empty state */
      },
    });
  }

  loadRoles(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.api.listRoles().subscribe({
      next: (list) => {
        this.roles.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editingId.set('');
    this.selected.set(new Set());
    this.form.reset({ name: '', description: '' });
    this.formError.set(null);
  }

  startEdit(role: Role): void {
    if (role.system) {
      return;
    }
    this.editingId.set(role.publicId);
    this.selected.set(new Set(role.permissionCodes));
    this.form.reset({ name: role.name, description: role.description ?? '' });
    this.formError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  isChecked(code: string): boolean {
    return this.selected().has(code);
  }

  toggle(code: string): void {
    this.selected.update((cur) => {
      const next = new Set(cur);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  /** Group-level "select all" convenience for a resource block. */
  allInGroup(group: PermissionGroup): boolean {
    return group.permissions.every((p) => this.selected().has(p.code));
  }

  toggleGroup(group: PermissionGroup): void {
    const all = this.allInGroup(group);
    this.selected.update((cur) => {
      const next = new Set(cur);
      for (const p of group.permissions) {
        if (all) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      }
      return next;
    });
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    const raw = this.form.getRawValue();
    const payload: CreateRolePayload = {
      name: raw.name.trim(),
      description: raw.description.trim() || undefined,
      permissionCodes: [...this.selected()],
    };
    const id = this.editingId();
    const op = id ? this.api.updateRole(id, payload) : this.api.createRole(payload);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.toast.success(id ? 'Role updated' : 'Role created');
        this.loadRoles();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.formError.set(this.messageFrom(err));
      },
    });
  }

  async remove(role: Role): Promise<void> {
    if (role.system) {
      return;
    }
    const ok = await this.confirm.ask({
      title: `Delete the "${role.name}" role?`,
      message: 'Members holding only this role will lose its permissions.',
      confirmText: 'Delete role',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.api.deleteRole(role.publicId).subscribe({
      next: () => {
        this.roles.update((list) => list.filter((r) => r.publicId !== role.publicId));
        this.toast.success('Role deleted');
      },
      error: (err: unknown) => this.toast.error(this.messageFrom(err)),
    });
  }

  label(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /** A permission's verb + scope, e.g. "READ:ALL" → "Read · All". */
  actionLabel(p: Permission): string {
    const action = this.label(p.action);
    return p.scope && p.scope !== 'ALL' ? `${action} · ${this.label(p.scope)}` : action;
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Operation failed. Please try again.';
  }
}
