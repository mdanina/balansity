// Схемы валидации с Zod
import { z } from 'zod';

// Базовые схемы
export const emailSchema = z
  .string()
  .min(1, 'Email обязателен')
  .email('Некорректный email');

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен быть не менее 6 символов')
  .max(100, 'Пароль слишком длинный')
  .regex(/^.{6,}$/, 'Пароль должен содержать минимум 6 символов');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона')
  .optional()
  .or(z.literal(''));

// Схема регистрации
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

// Схема входа
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

// Схема профиля
export const profileSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  lastName: z.string().max(100, 'Фамилия слишком длинная').optional(),
  phone: phoneSchema,
  region: z.string().optional(),
});

// Схема для добавления члена семьи
export const familyMemberSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  lastName: z.string().max(100, 'Фамилия слишком длинная').optional(),
  relationship: z.enum(['parent', 'child', 'partner', 'sibling', 'caregiver', 'other'], {
    errorMap: () => ({ message: 'Выберите тип отношения' }),
  }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  pronouns: z.string().max(50).optional(),
});

// Экспорт типов
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;





