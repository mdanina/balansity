FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY src ./src

# Собираем проект
RUN npm run build

# Создаем папку для логов
RUN mkdir -p logs

# Запускаем worker
CMD ["node", "dist/index.js"]

