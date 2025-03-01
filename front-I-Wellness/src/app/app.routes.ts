import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { TemasComponent } from './landing/temas/temas.component';
import { AnalisisComponent } from './landing/analisis/analisis.component';

export const routes: Routes = [
    { path: '', component: HomeComponent},
    { path: 'temas', component: TemasComponent},
    { path: 'analisis', component: AnalisisComponent},
    { path: '**', redirectTo: ''} // Redirect to home
];
