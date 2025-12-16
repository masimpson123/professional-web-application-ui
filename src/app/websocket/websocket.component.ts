import { Component, OnDestroy } from '@angular/core';

import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-websocket',
  imports: [],
  templateUrl: './websocket.component.html',
  styleUrl: './websocket.component.css',
  standalone: true
})
export class WebsocketComponent implements OnDestroy {
  client: Client;
  websocketResponse = "";
  connecting = false;
  constructor() {
    this.client = new Client({
      reconnectDelay: 0,
      // brokerURL: 'ws://localhost:8080/websocket-broker',
      brokerURL: 'wss://endpoint-one-2-205823180568.us-central1.run.app/websocket-broker',
      onConnect: () => {
        this.client.subscribe('/websocket-output', message => {
          this.websocketResponse = message.body;
        });
        this.connecting = false;
        alert("A websocket connection has been established.");
      },
      onStompError: () => {
        this.connecting = false;
        alert("A STOMP error has occurred.");
      },
      onWebSocketError: () => {
        this.connecting = false;
        alert("A WebSocket error has occurred.");
      },
      onDisconnect: () => {
        alert("The websocket connection has been destroyed.");
      },
    });
  }
  ngOnDestroy() {
    this.disconnect();
  }
  connect() {
    this.connecting = true;
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
