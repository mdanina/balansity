FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем исходный код
COPY src ./src

# Собираем проект
RUN npm run build

# Удаляем devDependencies после сборки для уменьшения размера образа
RUN npm prune --production

# Создаем папку для логов
RUN mkdir -p logs

# Запускаем worker
CMD ["node", "dist/index.js"]









