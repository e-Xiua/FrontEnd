export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  project?: string;
  priority?: TaskPriority;
  progress?: number; // 0-100
  dueDate?: string; // ISO date
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDetailDto extends TaskDto {
  messages?: MessageDto[];
}

export interface MessageDto {
  id?: number;
  taskId: number;
  senderId: string;
  receiverId?: string;
  content: string;
  timestamp?: string;
  readFlag?: boolean;
}

export interface TaskKpiDto {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  cancelled: number;
  overdue: number;
}
