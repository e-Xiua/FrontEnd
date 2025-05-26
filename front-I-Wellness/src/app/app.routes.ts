import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/home/home.component';
import { LoginComponent } from './features/landing/login/login.component';
import { RecuperarComponent } from './features/landing/recuperar/recuperar.component';
import { RegistroComponent } from './features/landing/registro/registro.component';
import { TemasComponent } from './features/landing/temas/temas.component';
import { HeaderAdminComponent } from './features/users/administrador/header-admin/header-admin.component';
import { AdminComponent } from './features/users/administrador/home-admin/home-admin.component';
import { PerfilAdminComponent } from './features/users/administrador/perfil-admin/perfil-admin.component';
import { ProveedoresComponent } from './features/users/administrador/proveedores/proveedores.component';
import { ServiciosComponent } from './features/users/administrador/servicios/servicios.component';
import { VisitantesComponent } from './features/users/administrador/visitantes/visitantes.component';
import { AgregarServicioComponent } from './features/users/proveedor/agregar-servicio/agregar-servicio.component';
import { DashboardComponent } from './features/users/proveedor/dashboard/dashboard.component';
import { EditarServicioComponent } from './features/users/proveedor/editar-servicio/editar-servicio.component';
import { HeaderProveedorComponent } from './features/users/proveedor/header-proveedor/header-proveedor.component';
import { MapaEmpresasComponent } from './features/users/turista/mapa-empresas/mapa-empresas.component';
import { HomeProveedorComponent } from './features/users/proveedor/home-proveedor/home-proveedor.component';
import { RegistroProveedorComponent } from './features/users/proveedor/registro-proveedor/registro-proveedor.component';
import { EditPreferenciasComponent } from './features/users/turista/edit-preferencias/edit-preferencias.component';
import { FormulariogustosComponent } from './features/users/turista/formulariogustos/formulariogustos.component';
import { HeaderTuristaComponent } from './features/users/turista/header-turista/header-turista.component';
import { HomeTuristaComponent } from './features/users/turista/home-turista/home-turista.component';
import { InfoServicioComponent } from './features/users/proveedor/info-servicio/info-servicio.component';
import { PerfilTuristaComponent } from './features/users/turista/perfil-turista/perfil-turista.component';
import { RegistroTuristaComponent } from './features/users/turista/registro-turista/registro-turista.component';
import { CrearTuristaComponent } from './features/users/administrador/crear-turista/crear-turista.component';
import { CrearProveedorComponent } from './features/users/administrador/crear-proveedor/crear-proveedor.component';
import { PerfilProveedorComponent } from './features/users/proveedor/perfil-proveedor/perfil-proveedor.component';
import { authGuard, turistaGuard, proveedorGuard, adminGuard } from './core/guards/auth.guard';
import { ServiciosProveedorComponent } from './features/users/proveedor/servicios-proveedor/servicios-proveedor.component';
import { VerReservasComponent } from './features/users/turista/ver-reservas/ver-reservas.component';
import { DashboardAdminComponent } from './features/users/administrador/dashboard-admin/dashboard-admin.component';
import { RestablecerComponent } from './features/landing/restablecer/restablecer.component';

export const routes: Routes = [
    // Rutas públicas
    { path: '', component: HomeComponent},
    { path: 'temas', component: TemasComponent},
    { path: 'registro', component: RegistroComponent},
    { path: 'login', component: LoginComponent},
    { path: 'registroturista', component: RegistroTuristaComponent},
    { path: 'recuperar', component: RecuperarComponent},
    { path: 'restablecer', component: RestablecerComponent },
    { path: 'registroproveedor', component: RegistroProveedorComponent},
    
    // Rutas compartidas - accesibles a todos los usuarios autenticados
    { path: 'infoservicio/:id', component: InfoServicioComponent, canActivate: [authGuard] },
   
    
    // Rutas específicas para Turistas
    { path: 'formulariogustos', component: FormulariogustosComponent, canActivate: [turistaGuard] },
    { path: 'perfilturista/:id', component: PerfilTuristaComponent, canActivate: [turistaGuard] },
    { path: 'hometurista', component: HomeTuristaComponent, canActivate: [turistaGuard] },
    { path: 'headerturista', component: HeaderTuristaComponent, canActivate: [turistaGuard] },
    { path: 'mapaempresas', component: MapaEmpresasComponent, canActivate: [turistaGuard] },
    { path: 'editpreferencias/:id', component: EditPreferenciasComponent, canActivate: [turistaGuard] },
    { path: 'proveedor/:id', component: ServiciosProveedorComponent, canActivate: [turistaGuard] },
    { path: 'reservasturista', component: VerReservasComponent, canActivate: [turistaGuard] },
    
    // Rutas específicas para Proveedores
    { path: 'homeproveedor', component: HomeProveedorComponent, canActivate: [proveedorGuard] },
    { path: 'agregarservicio', component: AgregarServicioComponent, canActivate: [proveedorGuard] },
    { path: 'editarservicio/:id', component: EditarServicioComponent, canActivate: [proveedorGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [proveedorGuard] },
    { path: 'headerproveedor', component: HeaderProveedorComponent, canActivate: [proveedorGuard] },
    { path: 'perfilproveedor/:id', component: PerfilProveedorComponent, canActivate: [proveedorGuard] },
    
    // Rutas específicas para Administradores
    { path: 'headeradmin', component: HeaderAdminComponent, canActivate: [adminGuard] },
    { path: 'homeadmin', component: AdminComponent, canActivate: [adminGuard] },
    { path: 'perfiladmin/:id', component: PerfilAdminComponent, canActivate: [adminGuard] },
    { path: 'visitantes', component: VisitantesComponent, canActivate: [adminGuard] },
    { path: 'servicios/:id', component: ServiciosComponent, canActivate: [adminGuard] },
    { path: 'proveedores', component: ProveedoresComponent, canActivate: [adminGuard] },
    { path: 'crearturista', component: CrearTuristaComponent, canActivate: [adminGuard] },
    { path: 'crearproveedor', component: CrearProveedorComponent, canActivate: [adminGuard] },
    { path: 'dashboard-admin', component: DashboardAdminComponent, canActivate: [adminGuard] },
    
    // Ruta comodín - redirige a home
    { path: '**', redirectTo: ''}, 
];