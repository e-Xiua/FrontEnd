export interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  dueDate?: string; // ISO date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDetailDto extends TaskDto {
  messages?: MessageDto[];
}

export interface MessageDto {
  id?: number;
  taskId: number;
  senderId?: string;
  senderName?: string;
  content: string;
  createdAt?: string;
}
