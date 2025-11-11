export interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  dueDate?: string; // ISO date
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  project?: string;
  progress?: number;
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
