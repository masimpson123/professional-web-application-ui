import { Component } from '@angular/core';
import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-websocket',
  imports: [],
  templateUrl: './websocket.component.html',
  styleUrl: './websocket.component.css'
})
export class WebsocketComponent {
  client: Client;
  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/websocket-broker',
      onConnect: () => {
        this.client.subscribe('/websocket-output', message => {
          alert(message);
        });
      },
      onDisconnect() {},
    });
  }
  connect() {
    this.client.activate();
  }
  disconnect() {
    this.client.deactivate();
  }
  sendMessage() {
    try {
      this.client.publish({
        destination: "/websocket-input",
        body: JSON.stringify({'name': 'mike'})
      });
    } catch (error) {
      alert(error);
    }
  }
}
