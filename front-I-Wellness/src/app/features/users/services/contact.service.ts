import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { UsuarioService } from './usuario.service';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly isAddingContactSubject = new BehaviorSubject<boolean>(false);
  private readonly isContactSubject = new BehaviorSubject<boolean>(false);

  readonly isAddingContact$ = this.isAddingContactSubject.asObservable();
  readonly isContact$ = this.isContactSubject.asObservable();

  constructor(private readonly usuarioService: UsuarioService) {}

  addContact(ownerId: number, contactId: number): Observable<void> {
    this.isAddingContactSubject.next(true);

    return this.usuarioService.addContact(ownerId, contactId).pipe(
      tap(() => this.isContactSubject.next(true)),
      finalize(() => this.isAddingContactSubject.next(false))
    );
  }

  loadContactState(ownerId: number, contactId: number): Observable<boolean> {
    return this.usuarioService.getContacts(ownerId).pipe(
      map(contacts => this.contactExists(contacts, contactId)),
      tap(isContact => this.isContactSubject.next(isContact)),
      catchError(() => {
        this.isContactSubject.next(false);
        return of(false);
      })
    );
  }

  resetContactState(): void {
    this.isAddingContactSubject.next(false);
    this.isContactSubject.next(false);
  }

  private contactExists(contacts: Array<unknown>, contactId: number): boolean {
    return contacts.some(contact => {
      if (!contact || typeof contact !== 'object') {
        return false;
      }

      const candidate = contact as { id?: number; contactId?: number; contactoId?: number };
      return (
        candidate.id === contactId ||
        candidate.contactId === contactId ||
        candidate.contactoId === contactId
      );
    });
  }
}
