import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-websocket',
  imports: [CommonModule],
  templateUrl: './websocket.component.html',
  styleUrl: './websocket.component.css'
})
export class WebsocketComponent {
  client: Client;
  websocketResponse = "";
  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/websocket-broker',
      onConnect: () => {
        this.client.subscribe('/websocket-output', message => {
          this.websocketResponse = message.body;
        });
        alert("A websocket connection has been established.");
      },
      onDisconnect() {
        alert("The websocket connection has been destroyed.");
      },
    });
  }
  connect() {
    this.client.activate();
  }
  disconnect() {
    this.client.deactivate();
  }
  sendMessage(message: string) {
    try {
      this.client.publish({
        destination: "/websocket-input",
        body: message
      });
    } catch (error) {
      alert(error);
    }
  }
}
