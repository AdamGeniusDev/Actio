import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
});

export const registerSchema = z.object({
  name:     z.string().min(2, '2 caractères minimum').max(50, '50 caractères maximum'),
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum').regex(/[A-Z]/, 'Une majuscule requise').regex(/[0-9]/, 'Un chiffre requis'),
});
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const createTaskSchema = z.object({
  title:       z.string().min(1, 'Un titre est requis').max(120, '120 caractères maximum'),
  description: z.string().max(500, '500 caractères maximum').optional(),
  priority:    z.enum(['low', 'medium', 'high', 'critical']),
  scheduledAt: z.string().datetime(),
  garantId:    z.string().uuid().optional(),
});

// Garant mode "app" — le garant est invité par email et installe l'app.
export const createGarantAppSchema = z.object({
  email: z.string().trim().min(1, "L'email est obligatoire").email('Email invalide'),
});

// Garant mode "direct" — alertes par SMS/Email/WhatsApp, sans app.
export const createGarantDirectSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire').max(50, '50 caractères maximum'),
  lastName:  z.string().trim().max(50, '50 caractères maximum').optional(),
});

export type LoginForm        = z.infer<typeof loginSchema>;
export type RegisterForm     = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type CreateTaskForm   = z.infer<typeof createTaskSchema>;
export type CreateGarantAppForm    = z.infer<typeof createGarantAppSchema>;
export type CreateGarantDirectForm = z.infer<typeof createGarantDirectSchema>;
