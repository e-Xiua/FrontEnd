import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { TemasComponent } from './landing/temas/temas.component';
import { AnalisisComponent } from './landing/analisis/analisis.component';
import { RegistroComponent } from './landing/registro/registro.component';
import { LoginComponent } from './landing/login/login.component';
import { RegistroTuristaComponent } from './users/turista/registro-turista/registro-turista.component';
import { RecuperarComponent } from './landing/recuperar/recuperar.component';
import { FormulariogustosComponent } from './users/turista/formulariogustos/formulariogustos.component';
import { HomeTuristaComponent } from './users/turista/home-turista/home-turista.component';
import { PerfilTuristaComponent } from './users/turista/perfil-turista/perfil-turista.component';
import { InfoServicioComponent } from './users/turista/info-servicio/info-servicio.component';
import { HeaderTuristaComponent } from './users/turista/header-turista/header-turista.component';
import { RegistroProveedorComponent } from './users/proveedor/registro-proveedor/registro-proveedor.component';
import { HomeProveedorComponent } from './users/proveedor/home-proveedor/home-proveedor.component';
import { AgregarServicioComponent } from './users/proveedor/agregar-servicio/agregar-servicio.component';
import { EditarServicioComponent } from './users/proveedor/editar-servicio/editar-servicio.component';
import { DashboardComponent } from './users/proveedor/dashboard/dashboard.component';
import { HeaderProveedorComponent } from './users/proveedor/header-proveedor/header-proveedor.component';
import { EditPreferenciasComponent } from './users/turista/edit-preferencias/edit-preferencias.component';
import { HeaderAdminComponent } from './users/administrador/header-admin/header-admin.component';
import { HomeAdminComponent } from './users/administrador/home-admin/home-admin.component';
import { PerfilAdminComponent } from './users/administrador/perfil-admin/perfil-admin.component';
import { VisitantesComponent } from './users/administrador/visitantes/visitantes.component';
import { ServiciosComponent } from './users/administrador/servicios/servicios.component';
import { ProveedoresComponent } from './users/administrador/proveedores/proveedores.component';

export const routes: Routes = [
    { path: '', component: HomeComponent},
    { path: 'temas', component: TemasComponent},
    { path: 'analisis', component: AnalisisComponent},
    { path: 'registro', component: RegistroComponent},
    { path: 'login', component: LoginComponent},
    { path: 'registroturista', component: RegistroTuristaComponent},
    { path: 'recuperar', component: RecuperarComponent},
    { path: 'formulariogustos', component: FormulariogustosComponent},
    { path: 'perfilturista', component: PerfilTuristaComponent},
    { path: 'hometurista', component: HomeTuristaComponent},
    { path: 'infoservicio', component: InfoServicioComponent},
    { path: 'headerturista', component: HeaderTuristaComponent},
    { path: 'registroproveedor', component: RegistroProveedorComponent},
    { path: 'homeproveedor', component: HomeProveedorComponent},
    { path: 'agregarservicio', component: AgregarServicioComponent},
    { path: 'editarservicio', component: EditarServicioComponent},
    { path: 'dashboard', component: DashboardComponent},	
    { path: 'headerproveedor', component: HeaderProveedorComponent},
    { path: 'editpreferencias', component: EditPreferenciasComponent},
    { path: 'headeradmin', component: HeaderAdminComponent},
    { path: 'homeadmin', component: HomeAdminComponent},	
    { path: 'perfiladmin', component: PerfilAdminComponent},
    { path: 'visitantes', component: VisitantesComponent},
    { path: 'servicios', component: ServiciosComponent},
    { path: 'proveedores', component: ProveedoresComponent},
    { path: '**', redirectTo: ''} // Redirect to home
];
