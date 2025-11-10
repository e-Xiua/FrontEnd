import { Component, OnInit, HostListener } from '@angular/core';
import { LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard-test',
  templateUrl: './dashboard-test.component.html',
  styleUrls: ['./dashboard-test.component.css'],
  imports: [NgxChartsModule],
  standalone: true,
})
export class DashboardTestComponent implements OnInit {
  view: [number, number] = [400, 300];
  colorScheme = 'cool';
  legendPosition: LegendPosition = LegendPosition.Below;

  metrics = {
    visitantesRegistrados: 2847,
    crecimientoVisitantes: 12.5,
    productosOfrecidos: 156,
    crecimientoProductos: 8.3,
    temporadaAlta: 78,
    crecimientoTemporada: 15.2,
    actividadPopular: 65,
    crecimientoActividad: 9.7,
    ingresosMensuales: 125000,
    crecimientoIngresos: 18.3,
    reservasActivas: 89,
    crecimientoReservas: 22.1,
    satisfaccionCliente: 4.8,
    crecimientoSatisfaccion: 5.2,
    proveedoresActivos: 45,
    crecimientoProveedores: 12.8
  };

  recentActivities = [
    {
      id: 1,
      type: 'reserva',
      message: 'Nueva reserva en Eco-lodge Arenal',
      time: 'Hace 5 minutos',
      status: 'success'
    },
    {
      id: 2,
      type: 'usuario',
      message: 'Usuario registrado: María González',
      time: 'Hace 15 minutos',
      status: 'info'
    },
    {
      id: 3,
      type: 'servicio',
      message: 'Nuevo servicio agregado: Yoga en la Naturaleza',
      time: 'Hace 1 hora',
      status: 'success'
    },
    {
      id: 4,
      type: 'pago',
      message: 'Pago procesado: $450 USD',
      time: 'Hace 2 horas',
      status: 'success'
    },
    {
      id: 5,
      type: 'review',
      message: 'Nueva reseña: 5 estrellas en Glamping Monteverde',
      time: 'Hace 3 horas',
      status: 'warning'
    }
  ];

  topDestinations = [
    { name: 'Arenal', visitors: 1250, growth: 15.2, image: 'assets/Arenal-la-fortuna.jpg' },
    { name: 'Monteverde', visitors: 980, growth: 12.8, image: 'assets/Arenal-la-fortuna.jpg' },
    { name: 'Manuel Antonio', visitors: 850, growth: 8.5, image: 'assets/Arenal-la-fortuna.jpg' },
    { name: 'Tortuguero', visitors: 420, growth: 22.1, image: 'assets/Arenal-la-fortuna.jpg' },
    { name: 'Cahuita', visitors: 380, growth: 18.7, image: 'assets/Arenal-la-fortuna.jpg' }
  ];

  weatherData = {
    location: 'San José, Costa Rica',
    temperature: 28,
    condition: 'Parcialmente nublado',
    humidity: 75,
    windSpeed: 12
  };

  productosData = [
    { name: 'Alimentación saludable', value: 35, description: 'Productos orgánicos y comidas saludables' },
    { name: 'Eco-lodge', value: 28, description: 'Alojamiento sostenible en la naturaleza' },
    { name: 'Glamping', value: 22, description: 'Camping de lujo con comodidades' },
    { name: 'Productos de cuidado personal', value: 10, description: 'Cosméticos naturales y artesanales' },
    { name: 'Finca agroecológica', value: 5, description: 'Experiencias agrícolas sostenibles' }
  ];

  productosSummary = {
    total: 100,
    topCategory: 'Alimentación saludable',
    topPercentage: 35,
    description: 'Los productos de alimentación saludable dominan el mercado con un 35% del total, seguidos por opciones de alojamiento ecológico que representan el 50% combinado.'
  };

  nacionalidadesData = [
    { name: 'Estados Unidos', value: 32, description: 'Principal mercado de turismo de bienestar' },
    { name: 'Canadá', value: 18, description: 'Segundo mercado más importante' },
    { name: 'Alemania', value: 15, description: 'Mercado europeo en crecimiento' },
    { name: 'Francia', value: 12, description: 'Interés en turismo sostenible' },
    { name: 'España', value: 8, description: 'Mercado hispanohablante' },
    { name: 'Reino Unido', value: 7, description: 'Turismo de aventura y bienestar' },
    { name: 'Otros', value: 8, description: 'Otros países europeos y latinoamericanos' }
  ];

  nacionalidadesSummary = {
    total: 100,
    topCountry: 'Estados Unidos',
    topPercentage: 32,
    description: 'Los visitantes de Estados Unidos representan un tercio del total, seguidos por Canadá y Alemania. Los mercados europeos combinados representan el 42% del turismo.'
  };

  actividadesData = [
    { name: 'Relajación y desestrés', value: 2.8, description: 'Yoga, meditación, spa' },
    { name: 'Conexión con la naturaleza', value: 2.5, description: 'Senderismo, observación de aves' },
    { name: 'Experiencia Bienestar', value: 2.3, description: 'Retiros de bienestar integral' },
    { name: 'Recuperación de energía', value: 2.1, description: 'Terapias alternativas, masajes' },
    { name: 'Turismo Espiritual', value: 1.9, description: 'Ceremonias, retiros espirituales' },
    { name: 'Aventura en la naturaleza', value: 1.7, description: 'Canopy, rafting, kayak' },
    { name: 'Experiencia rural', value: 1.5, description: 'Agroturismo, vida rural' }
  ];

  actividadesSummary = {
    total: 14.8,
    topActivity: 'Relajación y desestrés',
    topValue: 2.8,
    description: 'Las actividades de relajación y desestrés son las más populares, representando el 19% del total. La conexión con la naturaleza y las experiencias de bienestar integral completan el top 3.'
  };

  temporadasData = [
    { name: 'Temporada Baja', value: 1.2, description: 'Mayo-Junio, Septiembre-Octubre' },
    { name: 'Temporada Media', value: 2.8, description: 'Abril, Noviembre' },
    { name: 'Temporada Alta', value: 4.5, description: 'Diciembre-Abril, Julio-Agosto' }
  ];

  temporadasSummary = {
    total: 8.5,
    topSeason: 'Temporada Alta',
    topValue: 4.5,
    description: 'La temporada alta concentra el 53% de las visitas, principalmente en vacaciones de verano e invierno. La temporada media muestra un crecimiento sostenido del 133% sobre la temporada baja.'
  };

  ingresosMensualesData = [
    { name: 'Ene', value: 85000, description: 'Inicio de temporada alta' },
    { name: 'Feb', value: 92000, description: 'Mes de vacaciones' },
    { name: 'Mar', value: 105000, description: 'Semana Santa' },
    { name: 'Abr', value: 118000, description: 'Vacaciones de primavera' },
    { name: 'May', value: 125000, description: 'Temporada alta' },
    { name: 'Jun', value: 132000, description: 'Vacaciones de verano' },
    { name: 'Jul', value: 145000, description: 'Pico de temporada' },
    { name: 'Ago', value: 138000, description: 'Vacaciones de verano' },
    { name: 'Sep', value: 128000, description: 'Fin de temporada alta' },
    { name: 'Oct', value: 115000, description: 'Temporada media' },
    { name: 'Nov', value: 98000, description: 'Temporada baja' },
    { name: 'Dic', value: 125000, description: 'Vacaciones de fin de año' }
  ];

  ingresosSummary = {
    total: 1.4,
    peakMonth: 'Julio',
    peakValue: 145000,
    average: 116667,
    growth: 18.3,
    description: 'Los ingresos muestran un patrón estacional claro, con picos en julio (145,000 CRC) y valles en noviembre. El crecimiento anual es del 18.3%, superando las expectativas del mercado.'
  };

  satisfaccionData = [
    { name: 'Excelente', value: 65, description: '4.5-5.0 estrellas' },
    { name: 'Muy Bueno', value: 25, description: '4.0-4.4 estrellas' },
    { name: 'Bueno', value: 8, description: '3.5-3.9 estrellas' },
    { name: 'Regular', value: 2, description: '3.0-3.4 estrellas' },
    { name: 'Malo', value: 0, description: 'Menos de 3.0 estrellas' }
  ];

  satisfaccionSummary = {
    total: 100,
    topRating: 'Excelente',
    topPercentage: 65,
    average: 4.8,
    description: 'El 90% de los clientes califica la experiencia como "Muy Bueno" o "Excelente", con un promedio de 4.8/5 estrellas. Solo el 2% reporta experiencias regulares, sin calificaciones malas.'
  };

  reservasPorMesData = [
    { name: 'Enero', series: [
      { name: 'Confirmadas', value: 45 },
      { name: 'Pendientes', value: 12 },
      { name: 'Canceladas', value: 3 }
    ]},
    { name: 'Febrero', series: [
      { name: 'Confirmadas', value: 52 },
      { name: 'Pendientes', value: 8 },
      { name: 'Canceladas', value: 2 }
    ]},
    { name: 'Marzo', series: [
      { name: 'Confirmadas', value: 68 },
      { name: 'Pendientes', value: 15 },
      { name: 'Canceladas', value: 4 }
    ]},
    { name: 'Abril', series: [
      { name: 'Confirmadas', value: 75 },
      { name: 'Pendientes', value: 18 },
      { name: 'Canceladas', value: 2 }
    ]},
    { name: 'Mayo', series: [
      { name: 'Confirmadas', value: 89 },
      { name: 'Pendientes', value: 22 },
      { name: 'Canceladas', value: 5 }
    ]},
    { name: 'Junio', series: [
      { name: 'Confirmadas', value: 95 },
      { name: 'Pendientes', value: 25 },
      { name: 'Canceladas', value: 3 }
    ]}
  ];

  proveedoresPorRegionData = [
    { name: 'San José', value: 15 },
    { name: 'Alajuela', value: 8 },
    { name: 'Cartago', value: 6 },
    { name: 'Heredia', value: 5 },
    { name: 'Guanacaste', value: 7 },
    { name: 'Puntarenas', value: 3 },
    { name: 'Limón', value: 1 }
  ];

  tendenciasTemporalesData = [
    { name: '2022', value: 2100 },
    { name: '2023', value: 2450 },
    { name: '2024', value: 2847 }
  ];

  edadTuristasData = [
    { name: '18-25', value: 15 },
    { name: '26-35', value: 35 },
    { name: '36-45', value: 28 },
    { name: '46-55', value: 15 },
    { name: '56-65', value: 5 },
    { name: '65+', value: 2 }
  ];

  tipoAlojamientoData = [
    { name: 'Eco-lodge', value: 40 },
    { name: 'Glamping', value: 25 },
    { name: 'Hotel Boutique', value: 20 },
    { name: 'Casa Rural', value: 10 },
    { name: 'Hostal Ecológico', value: 5 }
  ];

  constructor() {}

  ngOnInit(): void {
    this.updateView();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateView();
  }

  private updateView(): void {
    const width = window.innerWidth;
    if (width < 768) {
      this.view = [300, 250];
    } else if (width < 1024) {
      this.view = [350, 280];
    } else {
      this.view = [400, 300];
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  formatCurrency(num: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(num);
  }

  formatDataLabel(value: number): string {
    return value.toFixed(1) + 'K';
  }

  formatCurrencyLabel(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPercentageLabel(value: number): string {
    return value + '%';
  }

  selectedItem: any = null;
  selectedItemDetails: any = null;

  onSelect(event: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(event)));
    this.selectedItem = event;
    this.getSelectedItemDetails(event);
  }

  onActivate(event: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(event)));
    this.selectedItem = event;
    this.getSelectedItemDetails(event);
  }

  onDeactivate(event: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(event)));
    this.selectedItem = null;
    this.selectedItemDetails = null;
  }

  getSelectedItemDetails(event: any): void {
    if (!event?.name) return;
    
    const itemName = event.name;
    let details = null;
    
    // Buscar en productosData
    const producto = this.productosData.find(p => p.name === itemName);
    if (producto) {
      details = {
        category: 'Productos',
        name: producto.name,
        value: producto.value,
        description: producto.description,
        summary: this.productosSummary
      };
    }
    
    // Buscar en nacionalidadesData
    const nacionalidad = this.nacionalidadesData.find(n => n.name === itemName);
    if (nacionalidad) {
      details = {
        category: 'Nacionalidades',
        name: nacionalidad.name,
        value: nacionalidad.value,
        description: nacionalidad.description,
        summary: this.nacionalidadesSummary
      };
    }
    
    // Buscar en actividadesData
    const actividad = this.actividadesData.find(a => a.name === itemName);
    if (actividad) {
      details = {
        category: 'Actividades',
        name: actividad.name,
        value: actividad.value,
        description: actividad.description,
        summary: this.actividadesSummary
      };
    }
    
    // Buscar en temporadasData
    const temporada = this.temporadasData.find(t => t.name === itemName);
    if (temporada) {
      details = {
        category: 'Temporadas',
        name: temporada.name,
        value: temporada.value,
        description: temporada.description,
        summary: this.temporadasSummary
      };
    }
    
    // Buscar en satisfaccionData
    const satisfaccion = this.satisfaccionData.find(s => s.name === itemName);
    if (satisfaccion) {
      details = {
        category: 'Satisfacción',
        name: satisfaccion.name,
        value: satisfaccion.value,
        description: satisfaccion.description,
        summary: this.satisfaccionSummary
      };
    }
    
    // Buscar en ingresosMensualesData
    const ingreso = this.ingresosMensualesData.find(i => i.name === itemName);
    if (ingreso) {
      details = {
        category: 'Ingresos',
        name: ingreso.name,
        value: ingreso.value,
        description: ingreso.description,
        summary: this.ingresosSummary
      };
    }
    
    this.selectedItemDetails = details;
  }
}