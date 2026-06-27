import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUser, CreateStaffUserPayload, Role } from '../../core/models';
import { UserAdminService } from '../../core/user-admin.service';
import { RoleAdminService } from '../../core/role-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import { ListStateComponent } from '../../shared/list-state/list-state';

/**
 * Team (staff) management. Lists internal users (audience=STAFF), invites a new staff member,
 * attaches/detaches roles, and toggles status. Self-targeting destructive actions are blocked in the
 * UI (the backend also guards them) to prevent an admin locking themselves out.
 */
@Component({
  selector: 'app-team-users',
  imports: [DatePipe, ReactiveFormsModule, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-users.html',
  styleUrl: './team-users.scss',
})
export class TeamUsersPage {
  private readonly usersApi = inject(UserAdminService);
  private readonly rolesApi = inject(RoleAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  readonly items = signal<AdminUser[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  private page = 0;

  readonly search = signal('');
  readonly inviteOpen = signal(false);
  readonly saving = signal(false);
  readonly inviteError = signal<string | null>(null);
  /** publicId currently having a role mutated — disables that row's role controls. */
  readonly busyId = signal<string | null>(null);

  /** Roles that can be assigned to staff — every role except the customer role. */
  readonly assignableRoles = computed(() => this.roles().filter((r) => r.name !== 'CUSTOMER'));

  readonly inviteForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['', Validators.required],
  });

  constructor() {
    this.loadRoles();
    this.load(0);
  }

  /** The signed-in admin's own id — used to hide self-destructive actions. */
  private get myId(): string | undefined {
    return this.auth.user()?.publicId;
  }

  isSelf(u: AdminUser): boolean {
    return !!this.myId && u.publicId === this.myId;
  }

  load(page: number): void {
    if (page === 0) {
      this.loading.set(true);
      this.errored.set(false);
    } else {
      this.loadingMore.set(true);
    }
    this.usersApi
      .list({ page, size: 20, search: this.search(), audience: 'STAFF' })
      .subscribe({
        next: (res) => {
          this.items.update((cur) => (page === 0 ? res.content : [...cur, ...res.content]));
          this.last.set(res.last);
          this.page = res.page;
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.errored.set(true);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  loadMore(): void {
    if (this.loadingMore() || this.last()) {
      return;
    }
    this.load(this.page + 1);
  }

  applySearch(value: string): void {
    this.search.set(value);
    this.load(0);
  }

  private loadRoles(): void {
    this.rolesApi.listRoles().subscribe({
      next: (list) => this.roles.set(list),
      error: () => {
        /* role chips degrade gracefully if the catalogue can't load */
      },
    });
  }

  toggleInvite(): void {
    this.inviteOpen.update((o) => !o);
    this.inviteError.set(null);
  }

  invite(): void {
    if (this.saving()) {
      return;
    }
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.inviteError.set(null);
    const raw = this.inviteForm.getRawValue();
    const payload: CreateStaffUserPayload = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      password: raw.password,
    };
    // Create the user, then attach the chosen role so they appear under STAFF immediately.
    this.usersApi.createStaff(payload).subscribe({
      next: (created) => {
        this.usersApi.assignRole(created.publicId, raw.role).subscribe({
          next: () => this.afterInvite(),
          // User exists even if the role attach fails — surface it but still refresh.
          error: () => {
            this.toast.error('Member created, but the role could not be attached. Add it from the list.');
            this.afterInvite();
          },
        });
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.inviteError.set(this.messageFrom(err));
      },
    });
  }

  private afterInvite(): void {
    this.saving.set(false);
    this.inviteOpen.set(false);
    this.inviteForm.reset({ role: '' });
    this.toast.success('Team member added');
    this.load(0);
  }

  addRole(u: AdminUser, roleName: string): void {
    if (!roleName || u.roles.includes(roleName) || this.busyId()) {
      return;
    }
    this.busyId.set(u.publicId);
    this.usersApi.assignRole(u.publicId, roleName).subscribe({
      next: () => {
        this.patchRoles(u.publicId, [...u.roles, roleName]);
        this.busyId.set(null);
        this.toast.success(`Added ${roleName}`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(this.messageFrom(err));
      },
    });
  }

  removeRole(u: AdminUser, roleName: string): void {
    if (this.busyId()) {
      return;
    }
    this.busyId.set(u.publicId);
    this.usersApi.removeRole(u.publicId, roleName).subscribe({
      next: () => {
        this.patchRoles(u.publicId, u.roles.filter((r) => r !== roleName));
        this.busyId.set(null);
        this.toast.success(`Removed ${roleName}`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(this.messageFrom(err));
      },
    });
  }

  rolesNotOn(u: AdminUser): Role[] {
    return this.assignableRoles().filter((r) => !u.roles.includes(r.name));
  }

  async setStatus(u: AdminUser, suspend: boolean): Promise<void> {
    if (suspend && this.isSelf(u)) {
      return;
    }
    if (suspend) {
      const ok = await this.confirm.ask({
        title: `Suspend ${u.firstName} ${u.lastName}?`,
        message: 'They will be signed out and blocked from the admin until reactivated.',
        confirmText: 'Suspend',
        danger: true,
      });
      if (!ok) {
        return;
      }
    }
    const op = suspend ? this.usersApi.suspend(u.publicId) : this.usersApi.activate(u.publicId);
    op.subscribe({
      next: () => {
        this.patchStatus(u.publicId, suspend ? 'SUSPENDED' : 'ACTIVE');
        this.toast.success(suspend ? 'Member suspended' : 'Member reactivated');
      },
      error: (err: unknown) => this.toast.error(this.messageFrom(err)),
    });
  }

  async remove(u: AdminUser): Promise<void> {
    if (this.isSelf(u)) {
      return;
    }
    const ok = await this.confirm.ask({
      title: `Remove ${u.firstName} ${u.lastName}?`,
      message: 'This revokes their access. Bookings and history are retained.',
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.usersApi.remove(u.publicId).subscribe({
      next: () => {
        this.items.update((list) => list.filter((x) => x.publicId !== u.publicId));
        this.toast.success('Team member removed');
      },
      error: (err: unknown) => this.toast.error(this.messageFrom(err)),
    });
  }

  private patchRoles(publicId: string, roles: string[]): void {
    this.items.update((list) => list.map((x) => (x.publicId === publicId ? { ...x, roles } : x)));
  }

  private patchStatus(publicId: string, status: string): void {
    this.items.update((list) => list.map((x) => (x.publicId === publicId ? { ...x, status } : x)));
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'is-confirmed';
      case 'SUSPENDED':
        return 'is-cancelled';
      default:
        return 'is-pending';
    }
  }

  /** Turn an UPPER_SNAKE code (role/status) into a readable "Title Case" label. */
  label(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Operation failed. Please try again.';
  }
}
