---
description: Protocolo de seguridad para despliegues en producción
---
# Protocolo de Seguridad Pre-Push

Este protocolo se activa automáticamente antes de realizar un `git push` para evitar subir código roto a la rama principal (y por tanto, a producción).

## 1. Verificación Automática (Git Hook)
El sistema tiene configurado un hook de **pre-push** que ejecuta automáticamente:
1.  `npm run build` en el cliente: Verifica que el proyecto de React compila correctamente y no tiene errores de sintaxis o referencias (como el TDZ que causó el incidente anterior).

Si este paso falla, **el push se cancelará automáticamente**.

## 2. Pasos manuales recomendados
Antes de confirmar una funcionalidad crítica:
1.  Ejecutar el entorno local: `npm run dev`
2.  Verificar la consola del navegador para errores rojos.
3.  Si es un cambio de dependencias o estructura, hacer un build limpio manual:
    ```bash
    cd client && rm -rf dist && npm run build
    ```

## 3. Recuperación
Si el hook bloquea tu push:
1.  Lee el error en la terminal.
2.  Corrige el código.
3.  Vuelve a hacer commit con el arreglo (`git commit --amend` si quieres sobreescribir).
4.  Intenta el push de nuevo.
