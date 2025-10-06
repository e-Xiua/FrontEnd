import { Routes } from '@angular/router';
import { adminGuard, authGuard, proveedorGuard, turistaGuard } from './core/guards/auth.guard';

// Landing/Public components
import { HomeComponent } from './features/landing/home/home.component';
import { LoginComponent } from './features/landing/login/login.component';
import { RecuperarComponent } from './features/landing/recuperar/recuperar.component';
import { RegistroComponent } from './features/landing/registro/registro.component';
import { RestablecerComponent } from './features/landing/restablecer/restablecer.component';
import { TemasComponent } from './features/landing/temas/temas.component';

// Layouts
import { AdminLayoutComponent } from './features/users/administrador/admin-layout/admin-layout.component';
import { ProveedorLayoutComponent } from './features/users/proveedor/proveedor-layout/proveedor-layout.component';
import { TuristaLayoutComponent } from './features/users/turista/turista-layout/turista-layout.component';

// Admin components
import { CrearProveedorComponent } from './features/users/administrador/crear-proveedor/crear-proveedor.component';
import { CrearTuristaComponent } from './features/users/administrador/crear-turista/crear-turista.component';
import { DashboardAdminComponent } from './features/users/administrador/dashboard-admin/dashboard-admin.component';
import { AdminComponent } from './features/users/administrador/home-admin/home-admin.component';
import { PerfilAdminComponent } from './features/users/administrador/perfil-admin/perfil-admin.component';
import { ProveedoresComponent } from './features/users/administrador/proveedores/proveedores.component';
import { ServiciosComponent } from './features/users/administrador/servicios/servicios.component';
import { VisitantesComponent } from './features/users/administrador/visitantes/visitantes.component';

// Proveedor components
import { AgregarServicioComponent } from './features/users/proveedor/agregar-servicio/agregar-servicio.component';
import { DashboardComponent } from './features/users/proveedor/dashboard/dashboard.component';
import { EditarServicioComponent } from './features/users/proveedor/editar-servicio/editar-servicio.component';
import { HomeProveedorComponent } from './features/users/proveedor/home-proveedor/home-proveedor.component';
import { PerfilProveedorComponent } from './features/users/proveedor/perfil-proveedor/perfil-proveedor.component';
import { ProveedorChatDemoComponent } from './features/users/proveedor/proveedor-chat-demo/proveedor-chat-demo.component';
import { RegistroProveedorComponent } from './features/users/proveedor/registro-proveedor/registro-proveedor.component';
import { ServiciosProveedorComponent } from './features/users/proveedor/servicios-proveedor/servicios-proveedor.component';

// Turista components
import { EditPreferenciasComponent } from './features/users/turista/edit-preferencias/edit-preferencias.component';
import { FormulariogustosComponent } from './features/users/turista/formulariogustos/formulariogustos.component';
import { HomeTuristaComponent } from './features/users/turista/home-turista/home-turista.component';
import { MapaEmpresasComponent } from './features/users/turista/mapa-empresas/mapa-empresas.component';
import { PerfilTuristaComponent } from './features/users/turista/perfil-turista/perfil-turista.component';
import { RegistroTuristaComponent } from './features/users/turista/registro-turista/registro-turista.component';
import { RutaDetalleComponent } from './features/users/turista/ruta-detalle/ruta-detalle.component';
import { VerReservasComponent } from './features/users/turista/ver-reservas/ver-reservas.component';

// Shared/Common components
import { InfoServicioComponent } from './features/users/proveedor/info-servicio/info-servicio.component';

export const routes: Routes = [
    // Rutas públicas
    { path: '', component: HomeComponent },
    { path: 'temas', component: TemasComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registroturista', component: RegistroTuristaComponent },
    { path: 'recuperar', component: RecuperarComponent },
    { path: 'restablecer', component: RestablecerComponent },
    { path: 'registroproveedor', component: RegistroProveedorComponent },

    // Rutas compartidas - accesibles a todos los usuarios autenticados
    { path: 'infoservicio/:id', component: InfoServicioComponent, canActivate: [authGuard] },

    // Rutas específicas para Turistas con Layout
    {
        path: 'turista',
        component: TuristaLayoutComponent,
        canActivate: [turistaGuard],
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeTuristaComponent },
            { path: 'formulariogustos', component: FormulariogustosComponent },
            { path: 'perfil/:id', component: PerfilTuristaComponent },
            { path: 'mapa-empresas', component: MapaEmpresasComponent },
            { path: 'ruta-detalle', component: RutaDetalleComponent },
            { path: 'edit-preferencias/:id', component: EditPreferenciasComponent },
            { path: 'proveedor/:id', component: ServiciosProveedorComponent },
            { path: 'reservas', component: VerReservasComponent },
        ]
    },

    // Rutas específicas para Proveedores con Chat Layout
    {
        path: 'proveedor',
        component: ProveedorLayoutComponent,
        canActivate: [proveedorGuard],
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeProveedorComponent },
            { path: 'chat-demo', component: ProveedorChatDemoComponent },
            { path: 'agregar-servicio', component: AgregarServicioComponent },
            { path: 'editar-servicio/:id', component: EditarServicioComponent },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'perfil/:id', component: PerfilProveedorComponent },
        ]
    },

    // Rutas específicas para Administradores con Admin Layout
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardAdminComponent },
            { path: 'home', component: AdminComponent },
            { path: 'perfil/:id', component: PerfilAdminComponent },
            { path: 'visitantes', component: VisitantesComponent },
            { path: 'servicios/:id', component: ServiciosComponent },
            { path: 'proveedores', component: ProveedoresComponent },
            { path: 'crear-turista', component: CrearTuristaComponent },
            { path: 'crear-proveedor', component: CrearProveedorComponent },
        ]
    },

    // Rutas legacy para compatibilidad (redirigen a las nuevas rutas)
    { path: 'hometurista', redirectTo: '/turista/home', pathMatch: 'full' },
    { path: 'perfilturista/:id', redirectTo: '/turista/perfil/:id', pathMatch: 'full' },
    { path: 'mapaempresas', redirectTo: '/turista/mapa-empresas', pathMatch: 'full' },
    { path: 'reservasturista', redirectTo: '/turista/reservas', pathMatch: 'full' },
    { path: 'editpreferencias/:id', redirectTo: '/turista/edit-preferencias/:id', pathMatch: 'full' },

    { path: 'homeproveedor', redirectTo: '/proveedor/home', pathMatch: 'full' },
    { path: 'perfilproveedor/:id', redirectTo: '/proveedor/perfil/:id', pathMatch: 'full' },
    { path: 'agregarservicio', redirectTo: '/proveedor/agregar-servicio', pathMatch: 'full' },
    { path: 'editarservicio/:id', redirectTo: '/proveedor/editar-servicio/:id', pathMatch: 'full' },
    { path: 'dashboard', redirectTo: '/proveedor/dashboard', pathMatch: 'full' },

    { path: 'homeadmin', redirectTo: '/admin/home', pathMatch: 'full' },
    { path: 'perfiladmin/:id', redirectTo: '/admin/perfil/:id', pathMatch: 'full' },
    { path: 'visitantes', redirectTo: '/admin/visitantes', pathMatch: 'full' },
    { path: 'proveedores', redirectTo: '/admin/proveedores', pathMatch: 'full' },
    { path: 'crearturista', redirectTo: '/admin/crear-turista', pathMatch: 'full' },
    { path: 'crearproveedor', redirectTo: '/admin/crear-proveedor', pathMatch: 'full' },
    { path: 'dashboard-admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },

    // Ruta comodín - redirige a home
    { path: '**', redirectTo: '' },
];
