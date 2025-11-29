// Скрипт для проверки переменных окружения
// Запуск: node check-env.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Проверка переменных окружения...\n');

const envFiles = ['.env', '.env.local', '.env.development'];

let envFound = false;
let envContent = '';

for (const envFile of envFiles) {
  try {
    const filePath = join(__dirname, envFile);
    envContent = readFileSync(filePath, 'utf-8');
    envFound = true;
    console.log(`✅ Найден файл: ${envFile}\n`);
    break;
  } catch (error) {
    // Файл не найден, продолжаем поиск
  }
}

if (!envFound) {
  console.log('❌ Файл .env не найден!\n');
  console.log('📝 Создайте файл .env в корне проекта со следующим содержимым:\n');
  console.log('VITE_SUPABASE_URL=your_url_here');
  console.log('VITE_SUPABASE_ANON_KEY=your_key_here\n');
  process.exit(1);
}

// Проверяем наличие переменных
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = [];
const found = [];

for (const varName of requiredVars) {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (match && match[1] && match[1].trim() !== '') {
    const value = match[1].trim();
    // Скрываем ключ для безопасности
    const displayValue = varName.includes('KEY') 
      ? `${value.substring(0, 20)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
    found.push(varName);
  } else {
    console.log(`❌ ${varName}: НЕ НАЙДЕНА`);
    missing.push(varName);
  }
}

console.log('');

if (missing.length > 0) {
  console.log('❌ Отсутствуют переменные:', missing.join(', '));
  console.log('\n📝 Добавьте их в файл .env');
  process.exit(1);
}

// Проверяем формат URL
const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m);
if (urlMatch) {
  const url = urlMatch[1].trim();
  if (!url.startsWith('http')) {
    console.log('⚠️  Внимание: VITE_SUPABASE_URL должен начинаться с http:// или https://');
  }
}

console.log('\n✅ Все переменные окружения настроены корректно!');
console.log('🚀 Можете запускать: npm run dev');




