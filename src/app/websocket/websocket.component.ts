import { Component, OnDestroy, signal } from '@angular/core';

import { Client } from '@stomp/stompjs';
import { form, Field, disabled } from '@angular/forms/signals';

@Component({
  selector: 'app-websocket',
  imports: [Field],
  templateUrl: './websocket.component.html',
  styleUrl: './websocket.component.css',
  standalone: true
})
export class WebsocketComponent implements OnDestroy {
  stompSignal = signal<Client|null>(null);
  connecting = false;
  messages: string[] = [];
  websocketForm = form(
    signal<ConnectionData>({
      roomId: ""
    }),
    form => disabled(form.roomId, () => !!this.stompSignal())
  );
  ngOnDestroy() {
    this.disconnect();
  }
  connect() {
    this.stompSignal.set(new Client({
      reconnectDelay: 0,
      //brokerURL: 'ws://localhost:8080/websocket-broker',
      brokerURL: 'wss://endpoint-one-2-205823180568.us-central1.run.app/websocket-broker',
      onConnect: () => {
        this.stompSignal()?.subscribe("/topic/room/" + this.websocketForm.roomId().value(),
        message => {
          this.messages.push(message.body);
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
    }));
    this.connecting = true;
    this.stompSignal()?.activate();
  }
  disconnect() {
    this.stompSignal()?.deactivate();
    this.stompSignal.set(null);
  }
  sendMessage(message: string) {
    try {
      this.stompSignal()?.publish({
        destination: "/app/room/" + this.websocketForm.roomId().value(),
        body: message
      });
    } catch (error) {
      alert(error);
    }
  }
}

interface ConnectionData {
  roomId: string;
}