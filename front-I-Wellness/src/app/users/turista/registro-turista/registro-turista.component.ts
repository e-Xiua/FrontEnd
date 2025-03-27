import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import countriesData from '../../../../assets/countries+cities.json';

@Component({
  selector: 'app-registro-turista',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './registro-turista.component.html',
  styleUrl: './registro-turista.component.css'
})
export class RegistroTuristaComponent implements OnInit {
  countriesData: any[] = countriesData;
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';

  name: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';

  nameError: string = '';
  emailError: string = '';
  phoneError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  ngOnInit() {
    this.countries = this.countriesData.map(country => country.name);
  }

  onCountryChange() {
    const country = this.countriesData.find(c => c.name === this.selectedCountry);
    this.cities = country ? country.cities : [];
  }

  validateName() {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!this.name.match(regex)) {
      this.nameError = 'El nombre solo puede contener letras y espacios';
    } else {
      this.nameError = '';
    }
  }

  validateEmail() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.email.match(regex)) {
      this.emailError = 'Ingrese un correo electrónico válido';
    } else {
      this.emailError = '';
    }
  }

  validatePhone() {
    const regex = /^[0-9]{7,15}$/;
    if (!this.phone.match(regex)) {
      this.phoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.phoneError = '';
    }
  }

  validatePassword() {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?/~]).{8,}$/;
    if (!RegExp(regex).exec(this.password)) {
      this.passwordError = 'Debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPassword() {
    if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    } else {
      this.confirmPasswordError = '';
    }
  }

  registerUser() {
    this.validateName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();

    if (!this.nameError && !this.emailError && !this.phoneError && !this.passwordError && !this.confirmPasswordError) {
      console.log('Registro exitoso:', {
        name: this.name,
        email: this.email,
        phone: this.phone,
        country: this.selectedCountry,
        city: this.cities,
      });

      this.router.navigate(['formulariogustos']);
    } else {
      console.log('Corrige los errores antes de enviar el formulario.');
    }
  }

  constructor(private router: Router) {}

}
