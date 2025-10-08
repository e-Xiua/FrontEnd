import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { PreferenciasService } from '../../../preferencias/services/preferencias/preferencias.service';
import { TuristaXPreferenciaService } from '../../../preferencias/services/turistaXpreferencias/turista-xpreferencia.service';

@Component({
  selector: 'app-formulariogustos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formulariogustos.component.html',
  styleUrl: './formulariogustos.component.css'
})
export class FormulariogustosComponent implements OnInit {
  // Variables para almacenar datos
  seleccionados: any[] = [];
  usuario: any = null;
  usuarioId: number = 0;
  correoUsuario: string = '';
  preferencias: any[] = [];

  constructor(
    private router: Router,
    private preferenciasService: PreferenciasService,
    private turistaXPreferencia: TuristaXPreferenciaService,
    private authService: AuthService // Añadimos el servicio de autenticación
  ) {}

  ngOnInit() {
    // Obtener correo registrado o autenticado
    this.correoUsuario = localStorage.getItem('registeredEmail') || '';

    if (!this.correoUsuario) {
      // Si no tenemos correo, verificamos autenticación
      if (!this.authService.isAuthenticated()) {
        console.log('Usuario no autenticado, redirigiendo a login');
        this.router.navigate(['login']);
        return;
      }

      // Intentamos obtener información del usuario autenticado
      this.authService.usuarioHome().subscribe({
        next: (userData: any) => {
          try {
            // Convertir la respuesta a objeto si viene como string
            const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

            if (user) {
              this.usuario = user;
              this.usuarioId = user.id;
              this.correoUsuario = user.correo || '';
              console.log('Usuario obtenido:', this.usuario);

              // Cargar preferencias
              this.cargarPreferencias();
            } else {
              console.error('No se pudo obtener información del usuario');
              this.manejarErrorUsuario();
            }
          } catch (e) {
            console.error('Error al procesar datos del usuario:', e);
            this.manejarErrorUsuario();
          }
        },
        error: (error) => {
          console.error('Error al obtener usuario:', error);
          this.manejarErrorUsuario();
        }
      });
    } else {
      // Si tenemos correo registrado, intentamos obtener el usuario
      console.log('Buscando usuario con correo:', this.correoUsuario);

      // Intentamos obtener el usuario por correo
      this.obtenerUsuarioPorCorreo();
    }
  }

  // Método para obtener usuario por correo
  obtenerUsuarioPorCorreo() {
    // Intentamos iniciar sesión si no estamos autenticados
    if (!this.authService.isAuthenticated() && localStorage.getItem('tempPassword')) {
      const password = localStorage.getItem('tempPassword');
      if (password) {
        this.authService.login(this.correoUsuario, password).subscribe({
          next: () => {
            localStorage.removeItem('tempPassword');
            this.cargarInfoUsuario();
          },
          error: (err) => {
            console.error('Error al iniciar sesión automática:', err);
            this.manejarErrorUsuario();
          }
        });
      } else {
        this.cargarInfoUsuario();
      }
    } else {
      this.cargarInfoUsuario();
    }
  }

  // Cargar información del usuario
  cargarInfoUsuario() {
    // Intentamos obtener la información del usuario
    this.authService.usuarioHome().subscribe({
      next: (userData: any) => {
        try {
          const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
          if (user) {
            this.usuario = user;
            this.usuarioId = user.id;
            console.log('Usuario obtenido:', this.usuario);
          } else {
            console.error('No se pudo obtener usuario completo');
            this.manejarErrorUsuario();
          }
        } catch (e) {
          console.error('Error al procesar usuario:', e);
          this.manejarErrorUsuario();
        } finally {
          // En cualquier caso, cargamos las preferencias
          this.cargarPreferencias();
        }
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.manejarErrorUsuario();
        this.cargarPreferencias();
      }
    });
  }

  // Método para cargar preferencias
  cargarPreferencias() {
    this.preferenciasService.obtenerPreferencias().subscribe({
      next: (data) => {
        this.preferencias = data;
        console.log('Preferencias cargadas:', this.preferencias);
      },
      error: (error) => {
        console.error('Error al obtener preferencias:', error);
        // En caso de error, cargar preferencias predeterminadas
      }
    });
  }

  // Método para manejar errores del usuario
  manejarErrorUsuario() {
    // Crear usuario temporal para la sesión
    this.usuario = {
      id: parseInt(localStorage.getItem('tempUserId') || '0') || Math.floor(Math.random() * 10000),
      nombre: 'Usuario',
      correo: this.correoUsuario || 'usuario@ejemplo.com'
    };

    this.usuarioId = this.usuario.id;
    localStorage.setItem('tempUserId', this.usuarioId.toString());

    console.log('Usando usuario temporal:', this.usuario);
  }

  // Método para seleccionar preferencias
  seleccionarGusto(item: any) {
    const index = this.seleccionados.indexOf(item);
    if (index > -1) {
      this.seleccionados.splice(index, 1); // Si ya está seleccionado, se deselecciona
    } else if (this.seleccionados.length < 5) {
      this.seleccionados.push(item); // Agregar a seleccionados si hay espacio
    }
  }

  agregarPreferencias() {
    if (this.seleccionados.length >= 3 && this.seleccionados.length <= 5) {
      if (!this.authService.isAuthenticated() || !this.usuario || !this.usuario.id) {
        Swal.fire({
          icon: 'warning',
          title: 'No autenticado',
          text: 'Debes iniciar sesión para guardar tus preferencias.',
          confirmButtonText: 'Ir al login',
          confirmButtonColor: '#4a9c9f',
        }).then(() => {
          localStorage.setItem('pendingPreferences', JSON.stringify(this.seleccionados));
          this.router.navigate(['/login']);
        });
        return;
      }

      const idUsuario = this.usuario.id;

      try {
        const peticiones = this.seleccionados.map(pref => {
          const turistaXPreferencia = {
            idUsuario: idUsuario,
            preferencia: {
              _idPreferencias: pref._idPreferencias || pref.id
            }
          };
          return this.turistaXPreferencia.crear(turistaXPreferencia);
        });

        if (peticiones.length > 0) {
          Swal.fire({
            title: 'Guardando tus preferencias...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          forkJoin(peticiones).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Preferencias guardadas',
                text: 'Tus preferencias se han guardado exitosamente.',
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#4a9c9f',
              }).then(() => this.router.navigate(['/turista/home']));
            },
            error: (err) => {
              console.error('Error al guardar alguna preferencia:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al guardar tus preferencias. Intenta de nuevo.',
                confirmButtonText: 'Ok',
                confirmButtonColor: '#4a9c9f',
              }).then(() => this.router.navigate(['/turista/home']));
            }
          });
        } else {
          this.router.navigate(['/turista/home']);
        }
      } catch (error) {
        console.error('Error general al guardar preferencias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error inesperado',
          text: 'Ocurrió un problema inesperado.',
          confirmButtonText: 'Volver',
          confirmButtonColor: '#4a9c9f',
        }).then(() => this.router.navigate(['/turista/home']));
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Selecciona más opciones',
        text: 'Debes seleccionar entre 3 y 5 preferencias antes de continuar.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4a9c9f',
      });
    }
  }
}
