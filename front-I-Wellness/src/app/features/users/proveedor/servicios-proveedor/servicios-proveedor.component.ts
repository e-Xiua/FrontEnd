import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-servicios-proveedor',
  imports: [CommonModule],
  templateUrl: './servicios-proveedor.component.html',
  styleUrl: './servicios-proveedor.component.css'
})
export class ServiciosProveedorComponent {

    proveedorId: any;
    servicios: any;
    nombreEmpresa: any;

    scrollStates: { [key: string]: { canScrollLeft: boolean; canScrollRight: boolean } } = {};


  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private servicioService: ServicioService
  ) {}

ngOnInit(): void {
  this.nombreEmpresa = sessionStorage.getItem('nombreEmpresa');
  this.proveedorId = this.route.snapshot.paramMap.get('id');

  if (this.proveedorId) {
    this.servicioService.obtenerServiciosPorProveedor(this.proveedorId).subscribe({
      next: (data) => {
        // ✅ Filtrar solo los servicios con estado en true
        this.servicios = data.filter((servicio: any) => servicio.estado === true);
        console.log('servicios filtrados:', this.servicios);

        setTimeout(() => {
          this.onScroll('para-ti');
          this.servicios.forEach((_: any, i: number) =>
            this.onScroll('grupo-' + i)
          );
        }, 500);
      },
      error: (err) => console.error('Error al obtener los servicios', err),
    });
  }
}


    navigateToDetalle(id: number) {
    this.router.navigate(['/infoservicio/', id]);
  }

  scrollLeft(id: string) {
    const container = document.getElementById(id);
    if (container) {
      container.scrollTo({ left: container.scrollLeft - 300, behavior: 'smooth' });
    }
  }

  scrollRight(id: string) {
    const container = document.getElementById(id);
    if (container) {
      container.scrollTo({ left: container.scrollLeft + 300, behavior: 'smooth' });
    }
  }



  onScroll(containerId: string) {
    const container = document.getElementById(containerId);
    if (container) {
      this.scrollStates[containerId] = {
        canScrollLeft: container.scrollLeft > 0,
        canScrollRight: container.scrollLeft + container.offsetWidth < container.scrollWidth
      };
    }
  }
}
