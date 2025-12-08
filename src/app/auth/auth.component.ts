import { Component, OnDestroy } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  Unsubscribe
} from 'firebase/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  standalone: true
})
export class AuthComponent implements OnDestroy {
  token = '';
  loading = false;
  stopListeningForAuthEvents: Unsubscribe;
  
  constructor(private http: HttpClient) {
    if (!(window as any).msiofa) {
      (window as any).msiofa = getAuth(initializeApp({
        apiKey: "AIzaSyAAFqGwaHCiin9O3PJJfK59rulwJabe1sM",
      }));
    }
    this.stopListeningForAuthEvents = 
      onAuthStateChanged((window as any).msiofa, async (user) => {
        if (user) this.token = await user.getIdToken();
    });
  }
  
  ngOnDestroy() {
    this.stopListeningForAuthEvents();
  }
  
  signUp() {
    let email = prompt("Please enter an email for your new account:");
    if (email === null) return;
    let password = prompt("Please enter a new password for your new account:");
    if (password === null) return;
    createUserWithEmailAndPassword((window as any).msiofa, email, password)
      .then(() => {
        alert('Your account was successfully created. You are now signed in.');
      })
      .catch((error) => {
        alert(error);
      });
  }
  
  signIn() {
    let email = prompt("What is your email?");
    if (email === null) return;
    let password = prompt("What is your password?");
    if (password === null) return;
    signInWithEmailAndPassword((window as any).msiofa, email, password)
      .then(() => {
        alert('You are now signed in.');
      })
      .catch((error) => {
        alert(error);
      });
  }
  
  signOut() {
    this.token = '';
    signOut((window as any).msiofa)
      .then(() => {
        alert('You are now signed out.');
      })
      .catch((error) => {
        alert(error);
      });
  }

  fetchWeather(advanced: boolean) {
    let securityToken = prompt('What is your security token?');
    if (securityToken === null) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`
    });
    this.loading = true;
    // http://localhost:8080/weather
    // https://endpoint-one-2-205823180568.us-central1.run.app/weather
    this.http.get<{response?: string, error?: string}>(
      'https://endpoint-one-2-205823180568.us-central1.run.app/weather' + (advanced ? '-advanced' : ''), {headers})
      .subscribe({
        next: weather => {
          this.loading = false;
          if (weather.response) alert(weather.response);
          if (weather.error) alert(weather.error);
        },
        error: error => {
          this.loading = false;
          alert(error.message);
        }});
  }

  requestAdvancedUsageClaim() {
    let securityToken = prompt('What is your security token?');
    if (securityToken === null) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`
    });
    this.loading = true;
    // http://localhost:8080/request-advanced-usage-claim
    // https://endpoint-one-2-205823180568.us-central1.run.app/request-advanced-usage-claim
    this.http.get<{response?: string, error?: string}>(
      'https://endpoint-one-2-205823180568.us-central1.run.app/request-advanced-usage-claim', {headers})
      .subscribe({
        next: response => {
          // this should sign the user out and sign the user back in.
          this.loading = false;
          if (response.response) {
            alert(response.response);
            alert("You will be signed out because this new claim invalidates your security token.");
            this.signOut();
          }
          if (response.error) alert(response.error);
        },
        error: error => {
          this.loading = false;
          alert(error.message);
        }});
  }
}
