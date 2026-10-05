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
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { environment } from '../../environments/environment';

// Module code runs once, so Firebase is initialised once however often the component is created.
const auth = getAuth(initializeApp({
  apiKey: "AIzaSyAAFqGwaHCiin9O3PJJfK59rulwJabe1sM",
}));

@Component({
  selector: 'app-auth',
  imports: [DemoHeaderComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  standalone: true
})
export class AuthComponent implements OnDestroy {
  token = '';
  tokenCopied = false;
  loading = false;
  stopListeningForAuthEvents: Unsubscribe;
  
  constructor(private http: HttpClient) {
    this.stopListeningForAuthEvents = 
      onAuthStateChanged(auth, async (user) => {
        if (user) this.token = await user.getIdToken();
    });
  }
  
  copyToken() {
    navigator.clipboard.writeText(this.token).then(() => {
      this.tokenCopied = true;
      setTimeout(() => this.tokenCopied = false, 2000);
    });
  }

  ngOnDestroy() {
    this.stopListeningForAuthEvents();
  }
  
  signUp() {
    const email = prompt("Please enter an email for your new account:");
    if (email === null) return;
    const password = prompt("Please enter a new password for your new account:");
    if (password === null) return;
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('Your account was successfully created. You are now signed in.');
      })
      .catch((error) => {
        alert(error);
      });
  }
  
  signIn() {
    const email = prompt("What is your email?");
    if (email === null) return;
    const password = prompt("What is your password?");
    if (password === null) return;
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('You are now signed in.');
      })
      .catch((error) => {
        alert(error);
      });
  }
  
  signOut() {
    this.token = '';
    signOut(auth)
      .then(() => {
        alert('You are now signed out.');
      })
      .catch((error) => {
        alert(error);
      });
  }

  fetchWeather(advanced: boolean) {
    const securityToken = prompt('What is your security token?');
    if (securityToken === null) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`
    });
    this.loading = true;
    this.http.get<{response?: string, error?: string}>(
      environment.springApiUrl + 'weather' + (advanced ? '-advanced' : ''), {headers})
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
    const securityToken = prompt('What is your security token?');
    if (securityToken === null) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`
    });
    this.loading = true;
    this.http.get<{response?: string, error?: string}>(
      environment.springApiUrl + 'request-advanced-usage-claim', {headers})
      .subscribe({
        next: response => {
          // The new claim invalidates the current ID token, so sign out. Signing in again
          // issues a token that carries the claim.
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
