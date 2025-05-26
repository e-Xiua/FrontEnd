import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoCambioService {

   constructor(private http: HttpClient) {}

   obtenerTipoCambioUSD(): Observable<number> {
    const url = 'https://apis.gometa.org/tdc/tdc.json';

    return this.http.get<any>(url).pipe(
      map(response => {
        // El tipo de cambio de compra
        return parseFloat(response.compra);
      })
    );
  }
}
