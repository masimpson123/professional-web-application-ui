import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop'
import { debounceTime, tap } from 'rxjs';
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-data-stream',
  imports: [FormsModule, CommonModule, DemoHeaderComponent],
  templateUrl: './data-stream.component.html',
  styleUrl: './data-stream.component.css',
  standalone: true
})
export class DataStreamComponent {
  searchInput = model('');
  controller: null|AbortController = null;
  results: object[] = [];
  constructor() {
    toObservable(this.searchInput).pipe(
      tap(() => this.results = []),
      debounceTime(500)
    ).subscribe((searchTerm) => {
      if (this.controller) this.controller.abort();
      this.controller = new AbortController();
      if (!searchTerm) return;
      fetch(environment.springApiUrl + 'search/' + searchTerm, { signal: this.controller.signal })
        .then(response => {
          const reader = response.body!.getReader();
          const read = () => {
            reader.read().then(({ value, done }) => {
              if (done) return;
              this.results.push(JSON.parse(new TextDecoder().decode(value)));
              read();
            })
            .catch(err => console.log(err));
          }
          read();
        })
        .catch(err => console.log(err));
    });
  }
}
