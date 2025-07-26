import { Component } from '@angular/core';

@Component({
  selector: 'app-ai',
  imports: [],
  templateUrl: './ai.component.html',
  styleUrl: './ai.component.css'
})
export class AiComponent {
  // post query
  constructor() {
    fetch("http://localhost:8080/ai")
      .then(response => response.json())
      .then(data => {
        JSON.parse(data.response).candidates
          .forEach((candidate:any) => candidate.content.parts
            .forEach((part:any) => console.log(part.text)));
      })
      .catch(err => console.log(err));
  }
}
