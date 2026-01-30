import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from './core/layout/header';
import { RouterOutlet } from '@angular/router';
import { Footer } from './core/layout/footer';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [Header, RouterOutlet, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
