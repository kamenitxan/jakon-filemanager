import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { I18nService } from '../../../../core/services/i18n.service';

export interface PermissionsDialogData {
  names: string[];
  hasFolders: boolean;
}

export interface PermissionsDialogResult {
  perms: string;
  permsCode: string;
  recursive: boolean;
}

type PermFlag = 'r' | 'w' | 'x';
type PermGroup = 'owner' | 'group' | 'others';

const FLAGS: PermFlag[] = ['r', 'w', 'x'];
const GROUPS: PermGroup[] = ['owner', 'group', 'others'];

@Component({
  selector: 'fm-permissions-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './permissions-dialog.html',
})
export class PermissionsDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<PermissionsDialogComponent, PermissionsDialogResult | undefined>,
  );
  readonly data = inject<PermissionsDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly groups = GROUPS;
  readonly flags = FLAGS;
  readonly recursive = signal(false);

  /** `checked[group][flag]` state, mirrors the old rwx-per-owner/group/others grid. */
  private readonly checked = signal<Record<PermGroup, Record<PermFlag, boolean>>>({
    owner: { r: true, w: true, x: false },
    group: { r: true, w: false, x: false },
    others: { r: true, w: false, x: false },
  });

  readonly permsString = computed(() => {
    const state = this.checked();
    return GROUPS.map((group) => FLAGS.map((flag) => (state[group][flag] ? flag : '-')).join(''))
      .join('');
  });

  readonly permsCode = computed(() => {
    const state = this.checked();
    return GROUPS.map((group) => {
      const value = FLAGS.reduce(
        (acc, flag, i) => acc + (state[group][flag] ? 2 ** (2 - i) : 0),
        0,
      );
      return value.toString();
    }).join('');
  });

  isChecked(group: PermGroup, flag: PermFlag): boolean {
    return this.checked()[group][flag];
  }

  toggle(group: PermGroup, flag: PermFlag): void {
    const state = this.checked();
    this.checked.set({
      ...state,
      [group]: { ...state[group], [flag]: !state[group][flag] },
    });
  }

  confirm(): void {
    this.dialogRef.close({
      perms: this.permsString(),
      permsCode: this.permsCode(),
      recursive: this.recursive(),
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
