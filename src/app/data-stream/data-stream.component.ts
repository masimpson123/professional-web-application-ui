import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop'
import { debounceTime, tap } from 'rxjs';

@Component({
  selector: 'app-data-stream',
  imports: [FormsModule, CommonModule],
  templateUrl: './data-stream.component.html',
  styleUrl: './data-stream.component.css',
  standalone: true
})
export class DataStreamComponent {
  searchInput = model('');
  controller: null|AbortController = null;
  results: {}[] = [];
  constructor() {
    toObservable(this.searchInput).pipe(
      tap(() => this.results = []),
      debounceTime(500)
    ).subscribe((searchTerm) => {
      if (this.controller) this.controller.abort();
      this.controller = new AbortController();
      if (!searchTerm) return;
      // http://localhost:8080/search/
      // https://endpoint-one-2-205823180568.us-central1.run.app/search/
      fetch("https://endpoint-one-2-205823180568.us-central1.run.app/search/" + searchTerm, { signal: this.controller.signal })
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
