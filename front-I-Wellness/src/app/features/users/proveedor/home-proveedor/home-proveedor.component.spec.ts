import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ChatRealtimeService } from '../../../../shared/services/chat-realtime.service';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { UsuarioService } from '../../services/usuario.service';
import { HomeProveedorComponent } from './home-proveedor.component';

describe('HomeProveedorComponent', () => {
  let component: HomeProveedorComponent;
  let fixture: ComponentFixture<HomeProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeProveedorComponent],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({}))
          }
        },
        {
          provide: AuthService,
          useValue: {
            getCurrentUserId: () => of(1),
            usuarioHome: () => of(JSON.stringify({ id: 1 }))
          }
        },
        {
          provide: UsuarioService,
          useValue: {
            obtenerPorIdPublico: () => of({ id: 1, nombre: 'Proveedor', correo: 'proveedor@test.com', proveedorInfo: {} }),
            addContact: () => of(null)
          }
        },
        {
          provide: ServicioService,
          useValue: {
            obtenerServiciosPorProveedor: () => of([]),
            eliminar: () => of(null),
            actualizar: () => of(null)
          }
        },
        {
          provide: ChatRealtimeService,
          useValue: {
            forceRefresh: () => of(null)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    (expect(component) as any).toBeTruthy();
  });
});
