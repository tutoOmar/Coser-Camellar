import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: 'appId', useValue: 'serverApp' }, // Aquí reemplaza withServerTransition
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
