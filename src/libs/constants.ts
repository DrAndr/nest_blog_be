export const CONFIRMATION_EMAIL_URI = '/auth/email-verification';
export const RESET_PASSWORD_EMAIL_URI = '/auth/reset-password';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  REGULAR = 'REGULAR',
}

enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
