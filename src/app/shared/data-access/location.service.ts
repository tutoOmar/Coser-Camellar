import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private countriesApiUrl = 'https://restcountries.com/v3.1/all';
  private citiesApiUrl = 'https://wft-geo-db.p.rapidapi.com/v1/geo/countries'; // API de RapidAPI para ciudades
  private apiKey = '578018102fmsh50fbb93fb09c89cp1a643bjsn315b4ded4c97'; // Reemplaza con tu clave de RapidAPI para la API de ciudades

  constructor(private http: HttpClient) {}

  // Obtiene la lista de países
  getCountries(): Observable<any[]> {
    return this.http.get<any[]>(this.countriesApiUrl);
  }

  // Obtiene la lista de ciudades según el código del país
  getCities(countryCode: string): Observable<any> {
    return this.http.get<any>(
      `${this.citiesApiUrl}/${countryCode}/regions?limit=20`,
      {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
      }
    );
  }
}
