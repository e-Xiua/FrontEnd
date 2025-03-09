import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { TemasComponent } from './landing/temas/temas.component';
import { AnalisisComponent } from './landing/analisis/analisis.component';
import { LoginComponent } from './landing/login/login.component';
import { LoginTuristaComponent } from './users/turista/login-turista/login-turista.component';
import { RegistroTuristaComponent } from './users/turista/registro-turista/registro-turista.component';
import { RecuperarTuristaComponent } from './users/turista/recuperar-turista/recuperar-turista.component';
import { FormulariogustosComponent } from './users/turista/formulariogustos/formulariogustos.component';
import { HomeTuristaComponent } from './users/turista/home-turista/home-turista.component';
import { PerfilTuristaComponent } from './users/turista/perfil-turista/perfil-turista.component';


export const routes: Routes = [
    { path: '', component: HomeComponent},
    { path: 'temas', component: TemasComponent},
    { path: 'analisis', component: AnalisisComponent},
    { path: 'login', component: LoginComponent},
    { path: 'loginturista', component: LoginTuristaComponent},
    { path: 'registroturista', component: RegistroTuristaComponent},
    { path: 'recuperarturista', component: RecuperarTuristaComponent},
    { path: 'formulariogustos', component: FormulariogustosComponent},
    { path: 'perfilturista', component: PerfilTuristaComponent},
    { path: 'hometurista', component: HomeTuristaComponent},
    { path: '**', redirectTo: ''} // Redirect to home
];
