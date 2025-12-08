#!/usr/bin/env node

/**
 * Скрипт для проверки настроек email в Supabase на продакшн сервере
 * 
 * Использование:
 *   node check-email-config.js
 * 
 * Или для проверки удаленного контейнера:
 *   node check-email-config.js --docker-compose /opt/beget/supabase/docker-compose.yml
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDockerCompose() {
  const args = process.argv.slice(2);
  const dockerComposeIndex = args.indexOf('--docker-compose');
  if (dockerComposeIndex !== -1 && args[dockerComposeIndex + 1]) {
    return args[dockerComposeIndex + 1];
  }
  
  // Попробуем найти docker-compose.yml в стандартных местах
  const possiblePaths = [
    '/opt/beget/supabase/docker-compose.yml',
    '/home/user/supabase/docker-compose.yml',
    '/opt/supabase/docker-compose.yml',
    './docker-compose.yml',
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return null;
}

function checkEnvFile() {
  const dockerComposePath = checkDockerCompose();
  if (!dockerComposePath) {
    return null;
  }
  
  const envPath = path.join(path.dirname(dockerComposePath), '.env');
  if (fs.existsSync(envPath)) {
    return envPath;
  }
  
  return null;
}

function readEnvFile(envPath) {
  if (!envPath || !fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
  });
  
  return env;
}

function checkDockerContainer(dockerComposePath) {
  if (!dockerComposePath) {
    return null;
  }
  
  try {
    const result = execSync(
      `docker compose -f "${dockerComposePath}" exec -T auth env 2>/dev/null || docker-compose -f "${dockerComposePath}" exec -T auth env 2>/dev/null`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const env = {};
    result.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1]] = match[2];
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function checkLogs(dockerComposePath) {
  if (!dockerComposePath) {
    return null;
  }
  
  try {
    const result = execSync(
      `docker compose -f "${dockerComposePath}" logs --tail=50 auth 2>/dev/null || docker-compose -f "${dockerComposePath}" logs --tail=50 auth 2>/dev/null`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    return result;
  } catch (error) {
    return null;
  }
}

function checkRequiredVars(env, source) {
  const required = {
    'GOTRUE_MAILER_AUTOCONFIRM': {
      expected: 'false',
      description: 'Требовать подтверждение email',
      critical: true,
    },
    'GOTRUE_SITE_URL': {
      expected: 'https://',
      description: 'URL сайта (должен начинаться с https://)',
      critical: true,
    },
    'GOTRUE_SMTP_HOST': {
      expected: 'smtp.',
      description: 'SMTP хост',
      critical: true,
    },
    'GOTRUE_SMTP_PORT': {
      expected: '587',
      description: 'SMTP порт (обычно 587)',
      critical: true,
    },
    'GOTRUE_SMTP_USER': {
      expected: '@',
      description: 'SMTP пользователь (email)',
      critical: true,
    },
    'GOTRUE_SMTP_PASS': {
      expected: '',
      description: 'SMTP пароль',
      critical: true,
    },
    'GOTRUE_SMTP_ADMIN_EMAIL': {
      expected: '@',
      description: 'Email отправителя',
      critical: false,
    },
    'GOTRUE_SMTP_SENDER_NAME': {
      expected: '',
      description: 'Имя отправителя',
      critical: false,
    },
  };
  
  const issues = [];
  const warnings = [];
  
  for (const [key, config] of Object.entries(required)) {
    const value = env[key];
    
    if (!value) {
      if (config.critical) {
        issues.push(`❌ ${key}: отсутствует (критично)`);
      } else {
        warnings.push(`⚠️  ${key}: отсутствует`);
      }
      continue;
    }
    
    if (config.expected) {
      if (key === 'GOTRUE_MAILER_AUTOCONFIRM') {
        if (value !== 'false') {
          issues.push(`❌ ${key}: значение "${value}", должно быть "false"`);
        } else {
          log(`✅ ${key}: ${value}`, 'green');
        }
      } else if (key === 'GOTRUE_SITE_URL') {
        if (!value.startsWith('https://')) {
          warnings.push(`⚠️  ${key}: "${value}" - рекомендуется использовать https://`);
        } else {
          log(`✅ ${key}: ${value}`, 'green');
        }
      } else if (key === 'GOTRUE_SMTP_PORT') {
        if (value !== '587' && value !== '465') {
          warnings.push(`⚠️  ${key}: "${value}" - обычно используется 587 или 465`);
        } else {
          log(`✅ ${key}: ${value}`, 'green');
        }
      } else if (config.expected === '@') {
        if (!value.includes('@')) {
          issues.push(`❌ ${key}: "${value}" - должен содержать @`);
        } else {
          log(`✅ ${key}: ${value.replace(/./g, '*')}`, 'green'); // Скрываем значение
        }
      } else if (value.includes(config.expected)) {
        log(`✅ ${key}: ${key.includes('PASS') ? '***' : value}`, 'green');
      } else {
        warnings.push(`⚠️  ${key}: "${value}" - проверьте правильность`);
      }
    } else {
      log(`✅ ${key}: ${key.includes('PASS') ? '***' : value}`, 'green');
    }
  }
  
  return { issues, warnings };
}

function main() {
  log('\n🔍 Проверка настроек email для Supabase\n', 'cyan');
  
  const dockerComposePath = checkDockerCompose();
  const envPath = checkEnvFile();
  
  log('📁 Файлы конфигурации:', 'blue');
  if (dockerComposePath) {
    log(`   docker-compose.yml: ${dockerComposePath}`, 'green');
  } else {
    log(`   docker-compose.yml: не найден`, 'red');
  }
  
  if (envPath) {
    log(`   .env: ${envPath}`, 'green');
  } else {
    log(`   .env: не найден`, 'yellow');
  }
  
  log('\n📋 Переменные окружения в .env файле:', 'blue');
  const envFileVars = readEnvFile(envPath);
  
  // Проверяем переменные с префиксом GOTRUE_ и без
  const gotrueVars = {};
  Object.keys(envFileVars).forEach(key => {
    if (key.startsWith('GOTRUE_')) {
      gotrueVars[key] = envFileVars[key];
    } else if (['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_ADMIN_EMAIL', 'SMTP_SENDER_NAME', 'SITE_URL'].includes(key)) {
      // Если переменные без префикса, добавляем префикс для проверки
      gotrueVars[`GOTRUE_${key}`] = envFileVars[key];
    }
  });
  
  if (Object.keys(gotrueVars).length === 0) {
    log('   ⚠️  Переменные GOTRUE_* не найдены в .env', 'yellow');
  } else {
    const { issues, warnings } = checkRequiredVars(gotrueVars, 'env file');
    if (issues.length > 0) {
      log('\n❌ Критические проблемы:', 'red');
      issues.forEach(issue => log(`   ${issue}`, 'red'));
    }
    if (warnings.length > 0) {
      log('\n⚠️  Предупреждения:', 'yellow');
      warnings.forEach(warning => log(`   ${warning}`, 'yellow'));
    }
  }
  
  log('\n🐳 Переменные окружения в контейнере auth:', 'blue');
  const containerVars = checkDockerContainer(dockerComposePath);
  
  if (!containerVars || Object.keys(containerVars).length === 0) {
    log('   ❌ Не удалось получить переменные из контейнера', 'red');
    log('   💡 Убедитесь, что:', 'yellow');
    log('      - Docker и docker-compose установлены', 'yellow');
    log('      - Контейнер auth запущен', 'yellow');
    log('      - У вас есть права на выполнение docker команд', 'yellow');
  } else {
    const gotrueContainerVars = {};
    Object.keys(containerVars).forEach(key => {
      if (key.startsWith('GOTRUE_')) {
        gotrueContainerVars[key] = containerVars[key];
      }
    });
    
    if (Object.keys(gotrueContainerVars).length === 0) {
      log('   ❌ Переменные GOTRUE_* не найдены в контейнере', 'red');
      log('   💡 Возможно, контейнер не перезапущен после изменения .env', 'yellow');
    } else {
      const { issues, warnings } = checkRequiredVars(gotrueContainerVars, 'container');
      if (issues.length > 0) {
        log('\n❌ Критические проблемы в контейнере:', 'red');
        issues.forEach(issue => log(`   ${issue}`, 'red'));
      }
      if (warnings.length > 0) {
        log('\n⚠️  Предупреждения:', 'yellow');
        warnings.forEach(warning => log(`   ${warning}`, 'yellow'));
      }
      
      // Сравнение .env и контейнера
      log('\n🔄 Сравнение .env и контейнера:', 'blue');
      const mismatches = [];
      Object.keys(gotrueVars).forEach(key => {
        if (gotrueContainerVars[key] && gotrueVars[key] !== gotrueContainerVars[key]) {
          mismatches.push(key);
        }
      });
      
      if (mismatches.length > 0) {
        log('   ⚠️  Обнаружены расхождения:', 'yellow');
        mismatches.forEach(key => {
          log(`      ${key}:`, 'yellow');
          log(`         .env: ${gotrueVars[key]}`, 'yellow');
          log(`         контейнер: ${gotrueContainerVars[key]}`, 'yellow');
        });
        log('   💡 Перезапустите контейнер: docker compose restart auth', 'yellow');
      } else {
        log('   ✅ Переменные совпадают', 'green');
      }
    }
  }
  
  log('\n📜 Последние логи контейнера auth (поиск ошибок email):', 'blue');
  const logs = checkLogs(dockerComposePath);
  
  if (logs) {
    const emailErrors = logs.split('\n').filter(line => 
      /mail|smtp|email/i.test(line) && /error|fail|timeout|refused/i.test(line)
    );
    
    if (emailErrors.length > 0) {
      log('   ❌ Найдены ошибки, связанные с email:', 'red');
      emailErrors.slice(-10).forEach(error => {
        log(`      ${error}`, 'red');
      });
    } else {
      log('   ✅ Ошибок, связанных с email, не найдено', 'green');
    }
  } else {
    log('   ⚠️  Не удалось получить логи', 'yellow');
  }
  
  log('\n📝 Рекомендации:', 'cyan');
  
  const hasIssues = (containerVars && Object.keys(containerVars).length > 0) 
    ? Object.keys(containerVars).filter(k => k.startsWith('GOTRUE_')).length === 0
    : true;
  
  if (hasIssues) {
    log('   1. Убедитесь, что GOTRUE_MAILER_AUTOCONFIRM=false (для включения подтверждения)', 'yellow');
    log('   2. Проверьте все SMTP настройки (HOST, PORT, USER, PASS)', 'yellow');
    log('   3. Убедитесь, что GOTRUE_SITE_URL указывает на правильный домен', 'yellow');
    log('   4. После изменений перезапустите контейнер: docker compose restart auth', 'yellow');
    log('   5. Проверьте логи: docker compose logs -f auth', 'yellow');
  } else {
    log('   ✅ Настройки выглядят правильно', 'green');
    log('   💡 Если письма все еще не приходят:', 'yellow');
    log('      - Проверьте папку "Спам"', 'yellow');
    log('      - Проверьте доступность SMTP сервера', 'yellow');
    log('      - Проверьте логи в реальном времени при регистрации', 'yellow');
  }
  
  log('\n');
}

if (require.main === module) {
  main();
}

module.exports = { main };
