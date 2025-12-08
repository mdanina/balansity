// Скрипт для проверки готовности к деплою в продакшн
// Запуск: node check-production-ready.js

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Проверка готовности к деплою в продакшн...\n');
console.log('='.repeat(60));

let allChecksPassed = true;

// Проверка 1: Фронтенд .env.production
console.log('\n📦 ФРОНТЕНД (.env.production)');
console.log('-'.repeat(60));

const frontendEnvPath = join(__dirname, '.env.production');
if (existsSync(frontendEnvPath)) {
  console.log('✅ Файл .env.production найден');
  
  const frontendEnv = readFileSync(frontendEnvPath, 'utf-8');
  const frontendRequired = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL'
  ];
  
  for (const varName of frontendRequired) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = frontendEnv.match(regex);
    
    if (match && match[1] && match[1].trim() !== '' && !match[1].includes('ваш-')) {
      const value = match[1].trim();
      const displayValue = varName.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: НЕ НАСТРОЕНА или содержит placeholder`);
      allChecksPassed = false;
    }
  }
} else {
  console.log('❌ Файл .env.production НЕ НАЙДЕН');
  console.log('  📝 Создайте файл на основе env.production.example');
  allChecksPassed = false;
}

// Проверка 2: Queue Worker .env
console.log('\n⚙️  QUEUE WORKER (.env)');
console.log('-'.repeat(60));

const queueWorkerEnvPath = join(__dirname, 'queue-worker', '.env');
if (existsSync(queueWorkerEnvPath)) {
  console.log('✅ Файл queue-worker/.env найден');
  
  const queueWorkerEnv = readFileSync(queueWorkerEnvPath, 'utf-8');
  const queueWorkerRequired = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'API_PORT',
    'API_BASE_URL',
    'FRONTEND_URL',
    'YUKASSA_SHOP_ID',
    'YUKASSA_SECRET_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  for (const varName of queueWorkerRequired) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = queueWorkerEnv.match(regex);
    
    if (match && match[1] && match[1].trim() !== '' && !match[1].includes('ваш-')) {
      const value = match[1].trim();
      const displayValue = varName.includes('KEY') || varName.includes('PASS')
        ? `${value.substring(0, 10)}...` 
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: НЕ НАСТРОЕНА или содержит placeholder`);
      allChecksPassed = false;
    }
  }
} else {
  console.log('❌ Файл queue-worker/.env НЕ НАЙДЕН');
  console.log('  📝 Создайте файл на основе queue-worker/env.production.example');
  allChecksPassed = false;
}

// Проверка 3: package.json и зависимости
console.log('\n📚 ЗАВИСИМОСТИ');
console.log('-'.repeat(60));

const packageJsonPath = join(__dirname, 'package.json');
if (existsSync(packageJsonPath)) {
  console.log('✅ package.json найден');
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('  ✅ Скрипт build найден');
    } else {
      console.log('  ❌ Скрипт build не найден в package.json');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('  ❌ Ошибка чтения package.json');
    allChecksPassed = false;
  }
} else {
  console.log('❌ package.json не найден');
  allChecksPassed = false;
}

// Проверка 4: queue-worker package.json
console.log('\n⚙️  QUEUE WORKER ЗАВИСИМОСТИ');
console.log('-'.repeat(60));

const queueWorkerPackageJsonPath = join(__dirname, 'queue-worker', 'package.json');
if (existsSync(queueWorkerPackageJsonPath)) {
  console.log('✅ queue-worker/package.json найден');
  
  try {
    const queueWorkerPackageJson = JSON.parse(readFileSync(queueWorkerPackageJsonPath, 'utf-8'));
    if (queueWorkerPackageJson.scripts && queueWorkerPackageJson.scripts.build) {
      console.log('  ✅ Скрипт build найден');
    } else {
      console.log('  ❌ Скрипт build не найден в queue-worker/package.json');
      allChecksPassed = false;
    }
    
    if (queueWorkerPackageJson.scripts && queueWorkerPackageJson.scripts['start:pm2']) {
      console.log('  ✅ Скрипт start:pm2 найден');
    } else {
      console.log('  ⚠️  Скрипт start:pm2 не найден (не критично)');
    }
  } catch (error) {
    console.log('  ❌ Ошибка чтения queue-worker/package.json');
    allChecksPassed = false;
  }
} else {
  console.log('❌ queue-worker/package.json не найден');
  allChecksPassed = false;
}

// Проверка 5: Nginx конфигурация
console.log('\n🌐 NGINX КОНФИГУРАЦИЯ');
console.log('-'.repeat(60));

const nginxExamplePath = join(__dirname, 'nginx.conf.example');
if (existsSync(nginxExamplePath)) {
  console.log('✅ nginx.conf.example найден');
  console.log('  📝 Используйте его как шаблон для /etc/nginx/sites-available/balansity');
} else {
  console.log('  ⚠️  nginx.conf.example не найден (не критично)');
}

// Итоговый результат
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
  console.log('\n📋 Следующие шаги:');
  console.log('  1. Убедитесь, что на сервере установлены: Node.js, npm, PM2, Nginx');
  console.log('  2. Склонируйте репозиторий на сервер');
  console.log('  3. Создайте .env.production и queue-worker/.env на сервере');
  console.log('  4. Выполните: npm install && npm run build');
  console.log('  5. Выполните: cd queue-worker && npm install && npm run build');
  console.log('  6. Настройте Nginx (см. DEPLOY_GUIDE_RU.md)');
  console.log('  7. Запустите queue-worker через PM2');
  console.log('\n📚 Подробная инструкция: DEPLOY_GUIDE_RU.md');
} else {
  console.log('❌ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОЙДЕНЫ');
  console.log('\n📝 Что нужно сделать:');
  console.log('  1. Создайте недостающие .env файлы');
  console.log('  2. Заполните все переменные окружения реальными значениями');
  console.log('  3. Убедитесь, что нет placeholder значений (ваш-домен, ваш-key и т.д.)');
  console.log('\n📚 См. примеры в:');
  console.log('  - env.production.example (для фронтенда)');
  console.log('  - queue-worker/env.production.example (для queue-worker)');
  process.exit(1);
}


