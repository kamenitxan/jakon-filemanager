import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { ToolbarComponent } from '../toolbar/toolbar';
import { TreeSidebarComponent } from '../tree-sidebar/tree-sidebar';
import { FileListComponent } from '../file-list/file-list';
import { FileGridComponent } from '../file-grid/file-grid';
import { FileManagerStoreService } from '../../../core/services/file-manager-store.service';

@Component({
  selector: 'fm-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    ToolbarComponent,
    TreeSidebarComponent,
    FileListComponent,
    FileGridComponent,
  ],
  templateUrl: './file-manager-shell.html',
  styleUrl: './file-manager-shell.scss',
})
export class FileManagerShellComponent implements OnInit {
  readonly store = inject(FileManagerStoreService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isHandset = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  ngOnInit(): void {
    this.store.refresh();
  }
}
