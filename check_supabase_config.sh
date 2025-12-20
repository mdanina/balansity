#!/bin/bash
# Скрипт для проверки и исправления настроек Supabase

echo "=== Текущие настройки в .env ==="
cd /opt/beget/supabase
cat .env | grep -E "SITE_URL|MAILER_URLPATHS_RECOVERY|ADDITIONAL_REDIRECT_URLS|GOTRUE_MAILER_EXTERNAL_HOSTS|API_EXTERNAL_URL"

echo -e "\n=== Текущие настройки в контейнере auth ==="
docker-compose exec auth env | grep -E "SITE_URL|MAILER_URLPATHS_RECOVERY|ADDITIONAL_REDIRECT|GOTRUE_MAILER_EXTERNAL_HOSTS|API_EXTERNAL_URL"

echo -e "\n=== Проверка docker-compose.yml (секция auth) ==="
docker-compose config | grep -A 30 "auth:" | grep -E "SITE_URL|MAILER_URLPATHS|GOTRUE|API_EXTERNAL" || echo "Не найдено в docker-compose.yml"

