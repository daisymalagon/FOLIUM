<<<<<<< HEAD
# 🍃 Folium
### Sistema de Gestión Documental Web

Folium es una aplicación web que permite a las organizaciones almacenar, clasificar, buscar y recuperar documentos digitales desde una plataforma centralizada, segura y accesible desde cualquier dispositivo con navegador web.

---

## ✨ Funcionalidades

- Registro e inicio de sesión de usuarios con autenticación JWT
- Subida de documentos en formato PDF, Word, Excel, JPG y PNG
- Clasificación de documentos por categorías
- Búsqueda de documentos por nombre y categoría
- Visualización y eliminación de documentos
- Panel de control con estadísticas en tiempo real
- Documentación interactiva de la API con Swagger
- Control de acceso basado en roles: administrador, colaborador y lector

---

## 🛠️ Tecnologías utilizadas

**Back-end**
- Node.js + Express
- PostgreSQL
- JWT (jsonwebtoken)
- Multer (carga de archivos)
- Swagger (documentación de la API)

**Front-end**
- React.js
- React Router v6
- Axios
- Context API
- Hooks: useState, useEffect, useContext, useReducer

---

## 📋 Requisitos previos

Antes de instalar el proyecto asegúrate de tener instalado:

| Herramienta | Versión recomendada | Descarga |
|-------------|--------------------|----|
| Node.js | LTS | https://nodejs.org |
| Git | Cualquier versión reciente | https://git-scm.com |
| PostgreSQL | 14 o superior | https://www.postgresql.org/download |

---

## 🚀 Instalación y configuración

### 1. Clonar el repositorio

Abre la terminal y escribe:

```bash
cd Desktop
git clone https://github.com/daisymalagon/FOLIUM.git
cd FOLIUM
```

### 2. Configurar el back-end

```bash
cd backend
npm install
```

Crea el archivo de variables de entorno:

```bash
# Crea un archivo llamado .env dentro de la carpeta backend
# con el siguiente contenido:
```
PORT=4000
DB_HOST=localhost
DB_USER=postgres
DB_PASS=admin123
DB_NAME=folium
JWT_SECRET=folium_clave_secreta_2024
FRONTEND_URL=http://localhost:3000

> ⚠️ Cambia `DB_PASS` por la contraseña que usaste al instalar PostgreSQL.

### 3. Crear la base de datos

Abre **pgAdmin 4**, conéctate a PostgreSQL y ejecuta el siguiente script SQL:

```sql
CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'colaborador'
                             CHECK (rol IN ('admin','colaborador','lector')),
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  padre_id  INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE documentos (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(255) NOT NULL,
  ruta         VARCHAR(255) NOT NULL,
  tipo_mime    VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  categoria_id INTEGER   REFERENCES categorias(id) ON DELETE SET NULL,
  usuario_id   INTEGER   NOT NULL REFERENCES usuarios(id),
  fecha_carga  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE log_actividad (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id),
  documento_id INTEGER REFERENCES documentos(id) ON DELETE SET NULL,
  accion       VARCHAR(50) NOT NULL,
  detalle      TEXT,
  realizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documentos_usuario   ON documentos(usuario_id);
CREATE INDEX idx_documentos_categoria ON documentos(categoria_id);
```

### 4. Configurar el front-end

Abre una segunda terminal y escribe:

```bash
cd Desktop/FOLIUM/frontend
npm install
```

---

## ▶️ Iniciar la aplicación

Necesitas **dos terminales abiertas al mismo tiempo**.

**Terminal 1 — Back-end:**
```bash
cd Desktop/FOLIUM/backend
node server.js
```

Resultado esperado: Folium API corriendo en puerto 4000
Conectado a PostgreSQL

**Terminal 2 — Front-end:**
```bash
cd Desktop/FOLIUM/frontend
npm start
```

El navegador se abrirá automáticamente en `http://localhost:3000`.

---

## 👤 Crear el primer usuario

La primera vez que uses la aplicación debes crear un usuario. Abre una tercera terminal y ejecuta:

```bash
Invoke-WebRequest -Uri "http://localhost:4000/api/auth/registrar" -Method POST -ContentType "application/json" -Body '{"nombre":"Tu Nombre","email":"tucorreo@email.com","password":"123456"}'
```

También puedes registrarte directamente desde la pantalla de inicio de sesión usando la pestaña **Crear cuenta**.

---

## 📖 Documentación de la API

Con el back-end corriendo, abre en el navegador: http://localhost:4000/api-docs

Allí encontrarás la documentación interactiva de todos los endpoints de la API generada automáticamente con Swagger.


## ⚠️ Solución de errores frecuentes

**Error: Cannot connect to PostgreSQL**
- Verifica que PostgreSQL esté corriendo en Windows (busca Services)
- Verifica que la contraseña en `.env` sea correcta

**Error: Cannot find module**
- Ejecuta `npm install` en la carpeta donde ocurre el error

**La página no carga en localhost:3000**
- Verifica que ambas terminales estén activas al mismo tiempo

**El login dice Credenciales incorrectas**
- Verifica que el usuario fue creado correctamente
- Verifica el correo y la contraseña utilizados

---

## 👩‍💻 Autora

Desarrollado por **Daisy Malagon**
Repositorio: https://github.com/daisymalagon/FOLIUM
=======
# FOLIUM

El desarrollo de un Sistema de Gestión Documental Web surge de la necesidad real que
tienen las organizaciones medianas y pequeñas de contar con una herramienta que les permita
administrar su información documental de manera ordenada, segura y eficiente. En un entorno
donde la generación de documentos digitales crece constantemente, seguir dependiendo de
métodos informales de almacenamiento e intercambio de archivos representa un riesgo
operativo que ninguna organización puede permitirse ignorar.

La importancia de construir esta aplicación web radica en que resuelve de forma integral
y permanente los problemas que hoy afectan la gestión documental de la organización. Al
centralizar todos los documentos en una única plataforma accesible desde cualquier dispositivo
con navegador web, se elimina la dispersión de información, se reduce el tiempo que los
empleados dedican a buscar archivos y se garantiza que todas las personas trabajen siempre
con la versión correcta y actualizada de cada documento. Esto se traduce directamente en
mayor productividad, menos errores en los procesos y mejores condiciones para la toma de
decisiones.

La aplicación Folium persigue fines de mayor alcance para la organización, no solo
resolver el problema inmediato. En primer lugar, busca proteger el patrimonio documental
institucional mediante un sistema de control de acceso por roles y respaldos automáticos que
salvaguarden la información ante cualquier eventualidad. En segundo lugar, pretende
establecer un estándar de organización documental que perdure en el tiempo, dotando a la
organización de un esquema claro de clasificación que pueda crecer y adaptarse junto con ella.
Finalmente, aspira a generar un cambio cultural en la manera en que la organización concibe y
gestiona su información, pasando de prácticas realizadas de manera física y dispersas, a
procesos estructurados, trazables y sostenibles que respondan a las exigencias del entorno
digital actual.
>>>>>>> cbadc2200b507a0705fec9efe39da319abfeadb9
