
export interface UsuarioDTO {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    urlFotoPerfil: string;
}

export interface Message {
  id: number;
    conversationId: number;
    senderId: number;
    receiverId: number;
    content: string;
    isRead: boolean;
    readAt: string;
    sentAt: string;
    timestamp?: Date; // For frontend usage
    type?: 'text' | 'image' | 'file'; // For frontend usage
    status?: 'sending' | 'sent' | 'delivered' | 'read'; // For frontend usage
}

export interface Conversation {
    id: number;
    createdAt: string;
    updatedAt: string;
    participant1: UsuarioDTO;
    participant2: UsuarioDTO;
    messages: Message[];
    providerId?: number; // For service mapping
    participant?: UsuarioDTO; // For service mapping
    lastMessage?: Message; // For service mapping
    unreadCount?: number;
}

export interface ConversationSummary {
    id: number;
    lastMessageAt: string;
    otherParticipant: UsuarioDTO;
    lastMessage: Message;
    unreadCount: number;
     // Add for service compatibility:
    participant?: UsuarioDTO; // Alias for otherParticipant
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
