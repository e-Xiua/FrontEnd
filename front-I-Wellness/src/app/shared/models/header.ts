/**
 * Interfaz base para headers reutilizables
 */
export interface BaseHeader {
  /**
   * Título o texto principal del header
   */
  title?: string;

  /**
   * URL del logo o imagen
   */
  logoUrl?: string;

  /**
   * Información del usuario logueado
   */
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  };

  /**
   * Items de navegación
   */
  navigationItems?: NavigationItem[];

  /**
   * Configuración de acciones del header
   */
  actions?: HeaderAction[];

  /**
   * Configuración de estilos
   */
  theme?: 'light' | 'dark' | 'auto';
}

export interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  active?: boolean;
  children?: NavigationItem[];
}

export interface HeaderAction {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  type?: 'button' | 'menu' | 'dropdown';
  items?: HeaderAction[];
}

/**
 * Configuración específica para cada tipo de header
 */
export interface HeaderConfig {
  role: 'admin' | 'proveedor' | 'turista' | 'public';
  config: BaseHeader;
}