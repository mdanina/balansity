// Простая проверка .env файла
// Запуск: node check-env-simple.js

import { existsSync, readFileSync } from 'fs';

console.log('🔍 Проверка переменных окружения...\n');

// Проверяем оба возможных имени файла
const envFiles = ['.env', '.env.local'];
let envFile = null;

for (const file of envFiles) {
  if (existsSync(file)) {
    envFile = file;
    console.log(`✅ Найден файл: ${file}\n`);
    break;
  }
}

if (!envFile) {
  console.log('❌ Файл .env не найден!\n');
  console.log('📝 Создайте файл .env или .env.local в корне проекта.\n');
  console.log('Содержимое (из CREATE_ENV_FILE.md):\n');
  console.log('VITE_SUPABASE_URL=https://oyuyienekon.beget.app');
  console.log('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0Mjg4MDAwLCJleHAiOjE5MjIwNTQ0MDB9.tQMuow03daqPpOTnwdMwOma5CNvzVpH1s_pTBxqPdZk\n');
  process.exit(1);
}

// Читаем файл
const content = readFileSync(envFile, 'utf-8');

// Проверяем переменные
const hasUrl = /^VITE_SUPABASE_URL\s*=\s*.+$/m.test(content);
const hasKey = /^VITE_SUPABASE_ANON_KEY\s*=\s*.+$/m.test(content);

console.log(hasUrl ? '✅ VITE_SUPABASE_URL: найдена' : '❌ VITE_SUPABASE_URL: не найдена');
console.log(hasKey ? '✅ VITE_SUPABASE_ANON_KEY: найден' : '❌ VITE_SUPABASE_ANON_KEY: не найден\n');

if (!hasUrl || !hasKey) {
  console.log('❌ Не все переменные настроены!\n');
  process.exit(1);
}

// Проверяем формат
const urlMatch = content.match(/^VITE_SUPABASE_URL\s*=\s*(.+)$/m);
if (urlMatch) {
  const url = urlMatch[1].trim();
  if (url && !url.startsWith('http')) {
    console.log('⚠️  Внимание: URL должен начинаться с http:// или https://\n');
  } else {
    console.log(`✅ URL формат: корректный (${url.substring(0, 30)}...)\n`);
  }
}

console.log('✅ Все проверки пройдены!');
console.log('🚀 Можете запускать: npm run dev\n');



