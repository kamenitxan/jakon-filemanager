import { Routes } from '@angular/router';
import { FileManagerShellComponent } from './features/file-manager/shell/file-manager-shell';

export const routes: Routes = [{ path: '**', component: FileManagerShellComponent }];
