# Sistema de Puntos - Camisetazo

## Descripción General

El sistema de puntos de Camisetazo permite a los usuarios acumular puntos con cada compra y canjearlos por descuentos exclusivos. El sistema incluye funcionalidades completas de gestión tanto para usuarios como para administradores.

## Características Principales

### Para Usuarios
- **Acumulación automática**: 10 puntos por cada camiseta comprada
- **Consulta de saldo**: Visualización clara del saldo actual en el perfil
- **Tienda de descuentos**: Canje de puntos por recompensas
- **Historial completo**: Seguimiento de todas las transacciones de puntos

### Para Administradores
- **Panel administrativo**: Gestión completa de puntos de usuarios
- **Búsqueda de usuarios**: Por email para ajustes rápidos
- **Ajuste manual**: Modificación del saldo de puntos con motivo
- **Lista de usuarios**: Vista de usuarios recientes

## Estructura de Base de Datos

```
users/
  {uid}/
    points: number                    // Saldo actual de puntos
    pointsHistory/                    // Historial de transacciones
      {timestamp}/
        previousPoints: number
        newPoints: number
        difference: number
        reason: string
        timestamp: string
        adminAction: boolean
        orderId?: string
    pointsByOrder/                    // Prevención de duplicados
      {orderId}/
        points: number
        timestamp: string
    redemptions/                      // Canjes realizados
      {timestamp}/
        pointsUsed: number
        rewardType: string
        rewardValue: number
        timestamp: string
        used: boolean
```

## Recompensas Disponibles

| Recompensa | Puntos | Tipo | Descripción |
|------------|--------|------|-------------|
| 5% Descuento | 50 | percentage | 5% de descuento en próxima compra |
| 10% Descuento | 100 | percentage | 10% de descuento en próxima compra |
| 15% Descuento | 150 | percentage | 15% de descuento en próxima compra |
| 20% Descuento | 200 | percentage | 20% de descuento en próxima compra |
| Envío Gratis | 80 | shipping | Envío gratuito en próxima compra |
| 5€ Descuento | 100 | fixed | 5€ de descuento fijo |
| 10€ Descuento | 200 | fixed | 10€ de descuento fijo |

## Funcionalidades de Seguridad

### Prevención de Duplicaciones
- Los puntos se marcan por orden de compra para evitar duplicados
- Validación de datos antes de procesar transacciones
- Límites máximos en canjes (1000 puntos por transacción)

### Validaciones Administrativas
- Solo emails autorizados pueden acceder al panel administrativo
- Confirmación obligatoria para cambios de puntos
- Límites en asignación de puntos (0-10,000)
- Motivo obligatorio para ajustes administrativos

### Validaciones de Usuario
- Verificación de puntos suficientes antes del canje
- Validación de tipos de recompensa
- Confirmación de canjes importantes

## Uso del Sistema

### Para Usuarios

1. **Ver puntos**: Ir a Perfil → Puntos
2. **Canjear recompensas**: Seleccionar recompensa en la tienda
3. **Ver historial**: Hacer clic en "Ver historial"

### Para Administradores

1. **Acceder al panel**: Iniciar sesión con email autorizado
2. **Buscar usuario**: Usar búsqueda por email o lista de usuarios
3. **Ajustar puntos**: Modificar saldo con motivo explicativo

## Configuración de Administradores

Para agregar nuevos administradores, modificar el array `ADMIN_EMAILS` en el código:

```javascript
const ADMIN_EMAILS = ['admin@camisetazo.com', 'nuevo-admin@camisetazo.com'];
```

## Integración con Compras

El sistema se integra automáticamente con el proceso de compra:

1. Al completar una compra, se calculan los puntos (10 por camiseta)
2. Se agregan automáticamente al saldo del usuario
3. Se registra en el historial con el ID de la orden
4. Se previenen duplicados usando el ID de orden

## Monitoreo y Mantenimiento

- **Logs**: Todas las transacciones se registran en la consola
- **Historial**: Trazabilidad completa de todos los cambios
- **Validaciones**: Múltiples capas de validación de datos
- **Mensajes**: Retroalimentación clara al usuario

## Consideraciones Técnicas

- **Firebase Realtime Database**: Almacenamiento en tiempo real
- **Transacciones atómicas**: Operaciones seguras y consistentes
- **Responsive**: Interfaz adaptada a móviles y escritorio
- **Performance**: Carga optimizada de datos de usuarios

## Troubleshooting

### Problemas Comunes

1. **Puntos no se agregan**: Verificar que el usuario esté autenticado
2. **Panel admin no aparece**: Verificar que el email esté en ADMIN_EMAILS
3. **Error en canje**: Verificar puntos suficientes y datos válidos

### Logs de Debug

El sistema incluye logs detallados en la consola del navegador para facilitar el debugging.

## Futuras Mejoras

- Integración con sistema de descuentos automáticos
- Notificaciones push para nuevos puntos
- Programa de fidelidad por niveles
- Estadísticas avanzadas para administradores

