# Changelog: Fix de Scroll/Selección de Texto

## Fecha: 2025-12-17

---

## Problema

Las reglas CSS de `user-select: none` aplicadas globalmente estaban generando problemas de scroll para los usuarios en dispositivos móviles.

---

## Solución

Eliminar las propiedades `user-select: none` del CSS global, permitiendo la selección de texto normal en toda la aplicación.

### Archivo: `client/src/index.css`

### Cambios realizados:

1. **En `html, body`:**
   - Eliminado: `-webkit-touch-callout: none`
   - Eliminado: `-webkit-user-select: none`
   - Eliminado: `-khtml-user-select: none`
   - Eliminado: `-moz-user-select: none`
   - Eliminado: `-ms-user-select: none`
   - Eliminado: `user-select: none`
   - **Mantenido:** `touch-action: pan-x pan-y` (previene zoom accidental)
   - **Mantenido:** `-webkit-tap-highlight-color: transparent`

2. **Eliminada clase `.allow-select`:**
   - Ya no es necesaria al permitir selección global

3. **En `input, textarea, select, button`:**
   - Eliminado: `-webkit-touch-callout: none`
   - Eliminado: `-webkit-user-select: none`
   - Eliminado: `user-select: none`
   - **Mantenido:** `touch-action: manipulation`

---

## Comportamiento después del cambio

| Aspecto | Antes | Después |
|---------|-------|---------|
| Selección de texto | Bloqueada | Permitida |
| Scroll en móvil | Podía fallar | Funciona correctamente |
| Zoom accidental | Prevenido | Prevenido (sin cambio) |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `client/src/index.css` | Eliminadas reglas de user-select: none |
