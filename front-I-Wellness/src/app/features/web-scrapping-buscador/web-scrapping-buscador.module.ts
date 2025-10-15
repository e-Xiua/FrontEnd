import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { WebScrappingBuscadorComponent } from './web-scrapping-buscador.component';

@NgModule({
  declarations: [WebScrappingBuscadorComponent],
  imports: [CommonModule, HttpClientModule, FormsModule],
  exports: [WebScrappingBuscadorComponent]
})
export class WebScrappingBuscadorModule {}
