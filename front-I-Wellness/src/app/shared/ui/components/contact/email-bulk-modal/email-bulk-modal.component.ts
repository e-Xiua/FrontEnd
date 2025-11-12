import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface EmailBulkModalData {
  initialEmail?: string;
}

@Component({
  selector: 'app-email-bulk-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './email-bulk-modal.component.html',
  styleUrl: './email-bulk-modal.component.css'
})
export class EmailBulkModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EmailBulkModalComponent>);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as EmailBulkModalData | undefined;

  emailForm: FormGroup;

  constructor() {
    const initialEmail = this.dialogData?.initialEmail || '';
    const initialEmailValidators = initialEmail 
      ? [Validators.required, Validators.email]
      : [Validators.required, Validators.email];
    
    this.emailForm = this.fb.group({
      emails: this.fb.array([
        this.fb.control(initialEmail, initialEmailValidators)
      ]),
      message: this.fb.control('', [Validators.required])
    });
  }

  get emails(): FormArray {
    return this.emailForm.get('emails') as FormArray;
  }

  get message(): string {
    return this.emailForm.get('message')?.value || '';
  }

  addEmailField(): void {
    this.emails.push(this.fb.control('', [Validators.required, Validators.email]));
  }

  removeEmailField(index: number): void {
    if (this.emails.length > 1) {
      this.emails.removeAt(index);
    }
  }

  getEmailValue(index: number): string {
    return this.emails.at(index).value || '';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValidEmails(): string[] {
    return this.emails.controls
      .map(control => control.value)
      .filter(email => email && email.trim() && this.isValidEmail(email.trim()));
  }

  onSend(): void {
    if (this.emailForm.valid) {
      const validEmails = this.getValidEmails();
      
      if (validEmails.length === 0) {
        return;
      }

      const emailList = validEmails.join(';');
      const subject = 'Consulta sobre servicios';
      const body = this.message;
      const mailtoUrl = `mailto:${emailList}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.open(mailtoUrl, '_blank');
      this.dialogRef.close();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

