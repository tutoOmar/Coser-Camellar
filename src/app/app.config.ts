import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'tu-chamba-cf127',
        appId: '1:808757943646:web:58b2596b30ba98f30903cf',
        storageBucket: 'tu-chamba-cf127.appspot.com',
        // locationId: 'us-central',
        apiKey: 'AIzaSyB1j1_VQM_zrNefqzreyyXAlYjXKgXI94U',
        authDomain: 'tu-chamba-cf127.firebaseapp.com',
        messagingSenderId: '808757943646',
        measurementId: 'G-CXFKE727DT',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient(),
  ],
};
