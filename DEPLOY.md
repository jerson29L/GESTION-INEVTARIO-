# Sistema de Gestión de Inventario - Yerb Amazon

## 🚀 Despliegue en Railway

### Paso 1: Preparar el proyecto
```bash
# Construir el frontend
npm install
npm run build:prod
```

### Paso 2: Subir a GitHub
```bash
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### Paso 3: Desplegar en Railway

1. Ve a [railway.app](https://railway.app)
2. Crea un nuevo proyecto desde GitHub
3. Selecciona tu repositorio

### Paso 4: Agregar MySQL

1. Click en "+ New" → "Database" → "MySQL"
2. Railway creará automáticamente la base de datos

### Paso 5: Configurar Variables de Entorno

En tu servicio web, agrega estas variables:

```
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
PORT=${{PORT}}
JWT_SECRET=tu_secreto_super_seguro_cambiar_esto_123456
SEED_ADMIN=true
NODE_ENV=production
```

### Paso 6: Importar Base de Datos

1. Click en tu servicio MySQL
2. Ve a "Data" → "Query"
3. Copia el contenido de `backend/database_backup.sql`
4. Ejecuta el script

### Paso 7: Deploy

Railway desplegará automáticamente. Tu app estará en:
```
https://tu-proyecto.railway.app
```

## 🔐 Acceso Inicial

- **Email:** admin@sistema.com
- **Password:** admin123

**⚠️ IMPORTANTE:** Cambia estas credenciales después del primer login.

## 📝 Estructura del Proyecto

```
├── src/                # Frontend Angular
├── backend/           # Backend Node.js/Express
│   ├── routes/       # Rutas de la API
│   ├── middleware/   # Autenticación JWT
│   ├── config/       # Configuración DB
│   └── server.js     # Servidor principal
└── dist/             # Build del frontend (generado)
```

## 🛠️ Desarrollo Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
npm install
npm start
```

## 📦 Tecnologías

- **Frontend:** Angular 20, TailwindCSS, TypeScript
- **Backend:** Node.js, Express, JWT, bcrypt
- **Base de Datos:** MySQL

## 🔗 API Endpoints

- `POST /api/auth/login` - Autenticación
- `GET /api/productos` - Listar productos
- `GET /api/dashboard` - Dashboard analytics
- `GET /api/usuarios` - Gestión de usuarios
- `GET /api/reportes` - Generar reportes

## 📄 Licencia

Proyecto desarrollado para gestión de inventario.
