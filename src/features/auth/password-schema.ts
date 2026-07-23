import { z } from 'zod';

// Mirrors backend PasswordValidationService (8-72, upper, lower, digit, special).
export const passwordSchema = z
  .string()
  .min(8, 'Mindestens 8 Zeichen')
  .max(72, 'Maximal 72 Zeichen')
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe')
  .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe')
  .regex(/[0-9]/, 'Mindestens eine Ziffer')
  .regex(/[^A-Za-z0-9]/, 'Mindestens ein Sonderzeichen')
  .refine((p) => p.trim().length === p.length, {
    message: 'Kein Leerzeichen am Anfang oder Ende',
  });
