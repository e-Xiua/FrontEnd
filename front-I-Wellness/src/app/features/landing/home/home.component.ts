import { Component, OnInit } from '@angular/core';
import { PieChartModule } from '@swimlane/ngx-charts';
import { LegendPosition } from '@swimlane/ngx-charts';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PieChartModule, NgxChartsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: []
})
export class HomeComponent implements OnInit {

  nacionalidadesData: any[] = [];
  nacionalidadTop: string = '';
  totalTuristas: number = 0;

  //DASHBOARD
  //PRODUCTOS
  productosData = [
    { name: 'Alimentación saludable', value: 1 },
    { name: 'Eco-lodge', value: 1 },
    { name: 'Glamping', value: 1 },
    { name: 'Productos de cuidado personal', value: 1 },
    { name: 'Finca agroecológica', value: 1 }
  ];

  showLegend = true;
  legendPosition: LegendPosition = LegendPosition.Below;
  mostrarInfoExtra = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:5000/api/turistas-nacionalidad')
    .subscribe(data => {
      this.nacionalidadesData = data;

      // Calcular la nacionalidad con más visitantes
      if (data && data.length > 0) {
        const top = data.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
        this.nacionalidadTop = top.name;
        this.totalTuristas = data.reduce((acc, curr) => acc + curr.value, 0);
      }
    });
  }


  //ACTIVIDADES
  actividadesVisitantesData = [
    { name: 'Relajación y descanso', value: 1 },
    { name: 'Conexión con la naturaleza', value: 3 },
    { name: 'Experiencia Bienestar Holística', value: 1 },
    { name: 'Recuperación de salud', value: 3 },
    { name: 'Turismo Espiritual', value: 1 },
    { name: 'Aventura en la naturaleza', value: 1},
    { name: 'Experiencia rural', value: 1}
  ];
  
  //TEMPORADA
  temporadaLineData = [
    {
      name: 'Visitas por temporada',
      series: [
        { name: 'Temporada Baja', value: 1 },
        { name: 'Temporada Media', value: 2 },
        { name: 'Temporada Alta', value: 5 }
      ]
    }
  ];
  
  onLeerMas(): void {
    this.mostrarInfoExtra = true;   // también podrías alternar: this.mostrarInfoExtra = !this.mostrarInfoExtra;
  }

}
