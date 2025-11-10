import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PreferenciasService } from '../../../preferencias/services/preferencias/preferencias.service';
import { TuristaXPreferenciaService } from '../../../preferencias/services/turistaXpreferencias/turista-xpreferencia.service';

@Component({
  selector: 'app-edit-preferencias',
  imports: [CommonModule],
  templateUrl: './edit-preferencias.component.html',
  styleUrl: './edit-preferencias.component.css'
})
export class EditPreferenciasComponent {

  seleccionados: any[] = [];
  preferencias: any[] = [];
  idUsuario!: number;
  peticiones: any[]= [];

  seleccionarGusto(item: any) {
    const index = this.seleccionados.indexOf(item);
    if (index > -1) {
      this.seleccionados.splice(index, 1); // Si ya está seleccionado, se deselecciona
    } else if (this.seleccionados.length < 5) {
      this.seleccionados.push(item); // Agregar a seleccionados si hay espacio
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private preferenciasService: PreferenciasService,
    private turistaXPreferencia: TuristaXPreferenciaService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idUsuario = +id;
        console.log('ID del usuario:', this.idUsuario);
        this.cargarPreferencias();
      }
    });
  }

  cargarPreferencias() {
    this.preferenciasService.obtenerPreferencias().subscribe({
      next: (data) => {
        this.preferencias = data;
        console.log('Preferencias cargadas:', this.preferencias);
      },
      error: (error) => {
        console.error('Error al obtener preferencias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar preferencias',
          text: 'Hubo un problema al cargar las preferencias. Intenta nuevamente.',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }

  agregarPreferencias() {
    if (this.seleccionados.length < 3 || this.seleccionados.length > 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Número incorrecto de preferencias',
        text: 'Debes seleccionar entre 3 y 5 preferencias.',
        confirmButtonColor: '#4a9c9f'
      });
      return;
    }

    if (!this.idUsuario) {
      console.error('No se encontró el ID del usuario.');
      return;
    }

    console.log('Eliminando preferencias previas del usuario:', this.idUsuario);

    // Paso 1: Eliminar todas las preferencias anteriores
    this.turistaXPreferencia.eliminarPreferenciasPorTurista(this.idUsuario).subscribe({
      next: () => {
        console.log('Preferencias anteriores eliminadas. Procediendo a guardar nuevas preferencias.');
        this.guardarNuevasPreferencias(); // Paso 2
      },
      error: (err: any) => {
        console.error('Error al eliminar preferencias anteriores:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar preferencias',
          text: 'No se pudieron eliminar las preferencias previas. Intenta nuevamente.',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }

  guardarNuevasPreferencias() {
    this.peticiones = this.seleccionados.map(pref => {
      const turistaXPreferencia = {
        idUsuario: this.idUsuario,
        preferencia: {
          _idPreferencias: pref._idPreferencias || pref.id
        }
      };
      return this.turistaXPreferencia.crear(turistaXPreferencia);
    });

    let exitos = 0;
    let errores = 0;

    this.peticiones.forEach((peticion, i) => {
      peticion.subscribe({
        next: () => {
          exitos++;
          if (exitos + errores === this.peticiones.length) {
            this.finalizarGuardado(exitos, errores);
          }
        },
        error: (err: any) => {
          errores++;
          console.error('Error al guardar preferencia:', err);
          if (exitos + errores === this.peticiones.length) {
            this.finalizarGuardado(exitos, errores);
          }
        }
      });
    });
  }



  finalizarGuardado(exitos: number, errores: number) {
    if (exitos === this.peticiones.length) {
      Swal.fire({
        icon: 'success',
        title: 'Preferencias guardadas',
        text: 'Tus preferencias han sido guardadas correctamente.',
        confirmButtonColor: '#4a9c9f'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Hubo un error',
        text: `Se guardaron ${exitos} preferencias, pero hubo un error con ${errores} preferencias.`,
        confirmButtonColor: '#4a9c9f'
      });
    }

    // Obtener el rol del usuario desde el localStorage
    const rol = localStorage.getItem('rol');

    // Verificar el rol y redirigir a la página correspondiente
    if (rol === 'Admin') {
      this.router.navigate(['/visitantes']);
    } else if (rol === 'Turista') {
      this.router.navigate(['/turista/home']);
    }
  }
}
