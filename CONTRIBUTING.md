# Guía de Contribución y Workflow

¡Bienvenido al equipo! Aquí documentamos cómo trabajamos para mantener el código ordenado y seguro.

## Estrategia de Ramas (Git Flow Simplificado)

Usamos dos ramas principales:

- **`main`**: Código de **PRODUCCIÓN**. Estable. Lo que ven los usuarios. **Nunca hacer push directo aquí (excepto hotfixes urgentes).**
- **`develop`**: Código de **STAGING** (Pruebas). Aquí integramos las nuevas funcionalidades para probarlas en el entorno de staging.

### Flujo de Trabajo para Nuevas Features

1.  **Crear una rama** desde `develop`:
    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feat/nombre-de-la-feature
    ```
2.  Desarrollar y hacer commits.
3.  **Abrir un Pull Request (PR)** hacia `develop`.
    - GitHub Actions ejecutará los tests automáticamente.
4.  Una vez aprobado y mergeado a `develop`:
    - Se desplegará automáticamente en el entorno de **Staging**.
    - Verificar en Render (buscar el servicio de staging).

### Paso a Producción

1.  Cuando `develop` esté probado y listo, abrir un PR de `develop` hacia `main`.
2.  Al mergear, Render desplegará automáticamente a **Producción**.

## Estándares

- **Commits**: Usar mensajes claros.
- **Tests**: Si agregas lógica nueva, agrega tests unitarios. Ejecuta `npm test` antes de subir.
