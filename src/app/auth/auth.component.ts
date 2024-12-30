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

console.log('initializeFile');
const app = initializeApp({
  apiKey: "AIzaSyAAFqGwaHCiin9O3PJJfK59rulwJabe1sM",
});
const auth = getAuth(app);

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnDestroy {
  token = '';
  stopListeningForAuthEvents: Unsubscribe;
  
  constructor(private http: HttpClient) {
    console.log('initializeInstance');
    this.stopListeningForAuthEvents = 
      onAuthStateChanged(auth, async (user) => {
        console.log('authStateChange');
        if (user) this.token = await user.getIdToken();
    });
  }
  
  ngOnDestroy() {
    console.log('destroyInstance');
    this.stopListeningForAuthEvents();
  }
  
  signUp() {
    console.log('signUp');
    let email = prompt("Please enter an email for your new account:");
    if (email === null) return;
    let password = prompt("Please enter a new password for your new account:");
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
    console.log('signIn');
    let email = prompt("What is your email?");
    if (email === null) return;
    let password = prompt("What is your password?");
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
    console.log('signOut');
    this.token = '';
    signOut(auth)
      .then(() => {
        alert('You are now signed out.');
      })
      .catch((error) => {
        alert(error);
      });
  }
  
  fetchWeather() {
    console.log('fetchWeather');
    let securityToken = prompt('What is your security token?');
    if (securityToken === null) return;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`
    });
    // http://localhost:8080/weather
    // https://endpoint-one-2-205823180568.us-central1.run.app/weather
    this.http.get<{weather?: string, error?: string}>('https://endpoint-one-2-205823180568.us-central1.run.app/weather', {headers})
      .subscribe({
        next: weather => {
          if (weather.weather) alert(weather.weather);
          if (weather.error) alert(weather.error);
        },
        error: error => {
          alert(error.message);
        }});
  }
}
