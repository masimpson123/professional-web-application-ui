import { Component } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

const firebaseConfig = {
    apiKey: "AIzaSyAAFqGwaHCiin9O3PJJfK59rulwJabe1sM",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  token = '';
  constructor(private http: HttpClient) {
    onAuthStateChanged(auth, async (user) => {
      console.log('authStateChange');
      if (user) {
        console.log(user);
        this.token = await user.getIdToken();
      } else {
        console.log('NO USER');
      }
    });
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
    this.http.get<{weather?: string, error?: string}>('http://localhost:8080/weather', {headers})
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
