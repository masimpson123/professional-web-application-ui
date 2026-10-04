import { Component, OnDestroy, signal } from '@angular/core';

import { Client } from '@stomp/stompjs';
import { form, Field, disabled } from '@angular/forms/signals';
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-websocket',
  imports: [Field, DemoHeaderComponent],
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
      // http(s):// becomes ws(s)://
      brokerURL: environment.springApiUrl.replace(/^http/, 'ws') + 'websocket-broker',
      onConnect: () => {
        this.stompSignal()?.subscribe("/sub/" + this.websocketForm.roomId().value(),
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
        destination: "/pub/" + this.websocketForm.roomId().value(),
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