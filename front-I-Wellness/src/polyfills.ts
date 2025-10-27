/**
 * Este archivo incluye polyfills necesarios para la aplicación
 * y se carga automáticamente por Angular CLI al arrancar la app.
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * Polyfill para 'global' requerido por SockJS-client y otras librerías de Node.js
 */
(window as any).global = window;

/**
 * Polyfill para 'process' si es necesario
 */
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  platform: 'browser'
};

/***************************************************************************************************
 * Zone JS
 */
import 'zone.js'; // Incluido automáticamente por Angular

/***************************************************************************************************
 * APPLICATION IMPORTS
 */
