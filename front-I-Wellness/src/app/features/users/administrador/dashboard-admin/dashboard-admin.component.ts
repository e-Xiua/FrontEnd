import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Importar NgxChartsModule
import { BarVertical2DComponent } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import * as L from 'leaflet';

interface Preferencia {
  genero: string;
  estadoCivil: string;
  intereses: string;
  total: number;
}

interface Interes {
  pais: string;
  intereses: string;
  total: number;
}

interface Proveedor {
  nombre_empresa: string;
  total: number;
}

// Definir una interfaz para los datos de servicio
interface Servicio {
  estado_texto: string;
}

interface Ubicacion {
  serviceName: string;
  coordenadaX: number;
  coordenadaY: number;
  estado_texto: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css'
})
export class DashboardAdminComponent implements OnInit {
[x: string]: any;

  preferenciasChart: any[] = [];
  interesesChart: any[] = [];
  proveedoresChart: any[] = [];
  servicios: Servicio[] = [];
  barChartData: any[] = [];
  generoChartData: any[] = [];
  estadoCivilChartData: any[] = [];
  reservas: any[] = [];
  reservasPorEstadoChart: any[] = [];

  // Propiedades para el mapa
  ubicaciones: Ubicacion[] = [];
  options = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 7,
    center: L.latLng(9.7489, -83.7534) // Centro de Costa Rica
  };

  totalEmpresas: number = 0;
  totalTuristas: number = 0;
  serviciosActivos: number = 0;
  serviciosInactivos: number = 0;

  colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF9843', '#FFDD95', '#86A7FC', '#3468C0', '#60B5FF']
  };

  colorSchemeGenero: Color = {
    name: 'customSchemeGenero',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3468C0', '#86A7FC']
  };

  xAxisTickFormatting = (label: string) => label; // No rota, muestra completo si cabe

  topProveedoresActivosChart: any[] = [];
  turistasGeneroChart: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.getServiciosData();
    this.cargarTopProveedoresActivos();
    this.cargarTuristasGenero();


  }

  

  cargarDatos() {

     // Obtener todas las reservas (solo para depuración o para mostrar en una tabla)
  this.http.get<any[]>('http://localhost:5000/api/reservas')
  .subscribe(data => {
    console.log('Reservas:', data); // <-- Aquí verás todas las reservas en consola
    this.reservas = data;
  });

  this.http.get<any[]>('http://localhost:5000/api/reservas')
    .subscribe(data => {
      this.reservas = data;
      this.reservasPorEstadoChart = this.getReservasPorEstado(data);
    });


    this.http.get<Preferencia[]>('http://localhost:5000/api/preferencias-usuario').subscribe(data => {
      this.preferenciasChart = data.map(item => ({
        name: `${item.genero} - ${item.estadoCivil}`,
        value: item.total
      }));

      // Agrupa por preferencia y género
    const groupedGenero: { [pref: string]: { [genero: string]: number } } = {};
    data
      .filter(item => item.genero === 'Femenino' || item.genero === 'Masculino')
      .forEach(item => {
        const cadena = item.intereses;
        if (cadena) {
          const preferencias = cadena.split(',').map((pref: string) => pref.trim());
          preferencias.forEach((pref: string) => {
            if (!groupedGenero[pref]) groupedGenero[pref] = {};
            groupedGenero[pref][item.genero] = (groupedGenero[pref][item.genero] || 0) + item.total;
          });
        }
      });

    // Solo las top N preferencias
    const topN = 6;
    const sortedPrefs = Object.keys(groupedGenero)
      .sort((a, b) => {
        // Ordena por el total de ambos géneros
        const totalA = (groupedGenero[a]['Femenino'] || 0) + (groupedGenero[a]['Masculino'] || 0);
        const totalB = (groupedGenero[b]['Femenino'] || 0) + (groupedGenero[b]['Masculino'] || 0);
        return totalB - totalA;
      })
      .slice(0, topN);

    // Formato final para ngx-charts-bar-vertical-2d
    this.generoChartData = sortedPrefs.map(pref => ({
      name: pref,
      series: [
        { name: 'Femenino', value: groupedGenero[pref]['Femenino'] || 0 },
        { name: 'Masculino', value: groupedGenero[pref]['Masculino'] || 0 }
      ]
    }));  

      // Preferencias agrupadas por preferencia y estado civil (Casado/a vs Soltero/a)
      const grouped: { [pref: string]: { [estado: string]: number } } = {};
      data
        .filter(item => item.estadoCivil === 'Casado/a' || item.estadoCivil === 'Soltero/a')
        .forEach(item => {
          const cadena = item.intereses; // Usa exactamente 'intereses'
          if (cadena) {
            const preferencias = cadena.split(',').map((pref: string) => pref.trim());
            preferencias.forEach((pref: string) => {
              if (!grouped[pref]) grouped[pref] = {};
              grouped[pref][item.estadoCivil] = (grouped[pref][item.estadoCivil] || 0) + item.total;
            });
          }
        });
      
      this.estadoCivilChartData = Object.keys(grouped).map(pref => ({
        name: pref,
        series: [
          { name: 'Casado/a', value: grouped[pref]['Casado/a'] || 0 },
          { name: 'Soltero/a', value: grouped[pref]['Soltero/a'] || 0 }
        ]
      }));
    });

    this.http.get<Interes[]>('http://localhost:5000/api/intereses-usuario').subscribe(data => {
      // Agrupa por país y selecciona el interés más popular de cada país
      const paisInteresMap: { [pais: string]: { interes: string, total: number } } = {};
      data.forEach(item => {
        const intereses = item.intereses.split(',').map((i: string) => i.trim());
        intereses.forEach(interes => {
          if (!paisInteresMap[item.pais] || paisInteresMap[item.pais].total < item.total) {
            paisInteresMap[item.pais] = { interes, total: item.total };
          }
        });
      });
      // Convierte a formato para ngx-charts y ordena por total descendente
      this.interesesChart = Object.keys(paisInteresMap)
        .map(pais => ({
          name: `${pais}: ${paisInteresMap[pais].interes}`,
          value: paisInteresMap[pais].total
        }))
        .sort((a, b) => b.value - a.value);
    });

    this.http.get<Proveedor[]>('http://localhost:5000/api/proveedores').subscribe(data => {
      this.proveedoresChart = data.map(item => ({
        name: item.nombre_empresa,
        value: item.total
      }));
      this.totalEmpresas = data.length;
    });

    // Obtener total de visitantes
    this.http.get<{total: number}>('http://localhost:5000/api/turistas').subscribe(data => {
      console.log('Datos recibidos Turista:', data); // DEBUG
      this.totalTuristas = data.total;
    });




  }

  getServiciosData() {
    this.http.get<any>('http://localhost:5000/api/dashboard-admin').subscribe(data => {
      console.log('Datos recibidos:', data); // DEBUG
      this.serviciosActivos = data.activos;
      this.serviciosInactivos = data.inactivos;
      
      // Preparar datos para el gráfico de barras
      this.barChartData = [
        { name: 'Activos', value: data.activos },
        { name: 'Inactivos', value: data.inactivos }
      ];
    }, error => {
      console.error('Error al obtener datos del backend', error); // DEBUG
    });
  }
  

  prepareBarChartData() {
    const estadoCounts: { [estado: string]: number } = {};
    this.servicios.forEach(servicio => {
      estadoCounts[servicio.estado_texto] = (estadoCounts[servicio.estado_texto] || 0) + 1;
    });
    this.barChartData = Object.keys(estadoCounts).map(key => ({
      name: key,
      value: estadoCounts[key]
    }));
  }



  cargarTopProveedoresActivos() {
    this.http.get<any[]>('http://localhost:5000/api/top-proveedores-activos').subscribe(data => {
      this.topProveedoresActivosChart = data.map(item => ({
        name: item.nombre_empresa,
        value: item.total
      }));
    });
  }

  cargarTuristasGenero() {
    this.http.get<any[]>('http://localhost:5000/api/turistas-genero').subscribe(data => {
      this.turistasGeneroChart = data.map(item => ({
        name: item.genero,
        value: item.total
      }));
    });
  }
  getConfirmadasCount(): number {
    return this.reservas.filter(r => r.estado === 'confirmada').length;
  }
  getCanceladasCount(): number {
    return this.reservas.filter(r => r.estado === 'cancelada').length;
  }

  getReservasPorEstado(reservas: any[]) {
    const estados: { [key: string]: number } = {};
    reservas.forEach(r => {
      estados[r.estado] = (estados[r.estado] || 0) + 1;
    });
    return Object.keys(estados).map(estado => ({
      name: estado,
      value: estados[estado]
    }));
  }
}
