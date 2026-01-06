# plataforma_reparto

## Docker

1. Copiar variables de entorno para el backend:

```bash
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores si es necesario
```

2. Construir y levantar los servicios:

```bash
docker-compose up --build
```

- La API estará en http://localhost:5000
- El frontend estará en http://localhost:3000
