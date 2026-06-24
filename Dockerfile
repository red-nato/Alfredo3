# 1. Usar una imagen ligera de Python
FROM python:3.9-slim

# 2. Instalar herramientas del sistema necesarias
# (Aunque uses SQLite, a veces se necesitan librerías de compilación)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Crear carpeta de trabajo
WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar TODO el proyecto
# Copiamos backend y frontend para mantener tu estructura de carpetas
COPY backend /app/backend
COPY frontend /app/frontend

# 6. Movernos a la carpeta donde está manage.py
WORKDIR /app/backend

# 7. Recolectar archivos estáticos (CSS, JS, Img)
# Esto crea una carpeta 'staticfiles' con todo listo para producción
RUN python manage.py collectstatic --noinput

# 8. Exponer el puerto
EXPOSE 8000

# 9. Comando para iniciar el servidor (Usamos Gunicorn en vez de runserver)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]