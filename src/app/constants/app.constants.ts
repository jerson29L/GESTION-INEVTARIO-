/**
 * Constantes de configuración de la aplicación
 * @description Centraliza valores de configuración para facilitar mantenimiento
 */

// URLs de API
export const API_CONFIG = {
  BASE_URL: typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? '' // En producción, usa URLs relativas (mismo servidor)
    : 'http://localhost:3000', // En desarrollo, usa localhost
  ENDPOINTS: {
    AUTH: '/api/auth',
    PRODUCTOS: '/api/productos',
    USUARIOS: '/api/usuarios',
    INCIDENCIAS: '/api/incidencias',
    REPORTES: '/api/reportes',
    DASHBOARD: '/api/dashboard'
  }
} as const;

// Configuración de Stock
export const STOCK_CONFIG = {
  LEVELS: {
    HIGH_THRESHOLD: 10,
    LOW_THRESHOLD: 1
  },
  STATES: {
    AVAILABLE: 'Disponible',
    LOW_STOCK: 'Pocas unidades',
    OUT_OF_STOCK: 'Sin Stock'
  }
} as const;

// Configuración de autenticación
export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 horas en milliseconds
} as const;

// Validaciones
export const VALIDATION_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PRODUCT: {
    MIN_STOCK: 0,
    MAX_STOCK: 999999
  }
} as const;

// Mensajes de error
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  UNAUTHORIZED: 'No tiene permisos para realizar esta acción.',
  SERVER_ERROR: 'Error interno del servidor.',
  VALIDATION_ERROR: 'Por favor, verifique los datos ingresados.'
} as const;