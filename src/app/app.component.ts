import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'client-2025';
  token = '';
  weather:Observable<string>|null = null;
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
    let email = prompt("Please enter an email for your new account:") ?? '';
    let password = prompt("Please enter a new password for your new account:") ?? '';
    createUserWithEmailAndPassword(auth, email, 'bingo1')
      .then(() => {
        alert('Your account was successfully created. You are now signed in.');
      })
      .catch((error) => {
        console.log(error);
      });
  }
  signIn() {
    console.log('signIn');
    let email = prompt("What is your email?") ?? '';
    let password = prompt("What is your password?") ?? '';
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('You are now signed in.');
      })
      .catch((error) => {
        console.log(error);
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
        console.log(error);
      });
  }
  fetchWeather() {
    console.log('fetchWeather');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
    this.weather = this.http.get<string>('http://localhost:8080/weather', {headers});
  }
}
