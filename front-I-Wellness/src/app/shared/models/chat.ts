
export interface Message {
  id: string;
  senderId: number; // 0 para usuario actual, id del provider para mensajes del provider
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  providerId: number;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatService {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // en minutos
  category: string;
  image?: string;
  available: boolean;
}

export interface ChatProvider {
  // Propiedades básicas del usuario
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  cedula: string;
  proveedorInfo?: {
    nombreEmpresa: string;
    descripcion: string;
    latitud: number;
    longitud: number;
    telefono: string;
    email: string;
    sitioWeb?: string;
  };

  // Propiedades específicas del chat
  contactName: string;
  photo: string;
  rating: number;
  totalReviews: number;
  services: ChatService[];
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ChatState {
  providers: ChatProvider[];
  conversations: Conversation[];
  selectedProviderId: number | null;
  currentUserId: number;
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageRequest {
  providerId: number;
  content: string;
  type: 'text' | 'image' | 'file';
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}
