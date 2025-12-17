# Communication Protocol

1.  **NEVER ASSUME**: Do not assume the user has performed a step unless explicitly confirmed.
2.  **Verify Explicitly**: Before moving to the next broad phase, ask the user to verify the current state (e.g., "Is the site loading?" "Did you see the green checkmark?").
3.  **Technical Precision**: Use precise engineering vernacular. Avoid simplified metaphors. The user is an experienced technical product manager.
4.  **Complete Configuration**: Infrastructure is not just "servers"; it includes Environment Variables, Auth providers, Domains, and Database connections. A task is not done until the app is *usable*.
5.  **Idioma**: Toda la documentación y explicaciones deben estar en **Español**, manteniendo la terminología técnica en **Inglés** (ej: "Deploy", "Staging", "Snapshot", no "Despliegue", "Puesta en escena").
6.  **Paridad de Entornos (Environment Parity)**: NUNCA asumir que un entorno "no-producción" es "desarrollo local". Staging debe comportarse exactamente igual que Producción (puertos, protocolos, seguridad). El código del cliente NO debe tener lógica del tipo `if (!production) usePort3000`. Debe ser explícito: `if (localhost) usePort3000`.

7.  **Defensive Schema Evolution**: Al leer de base de datos (NoSQL), NUNCA asumir que un campo existe. Usar siempre **Optional Chaining** (`?.`) y **Nullish Coalescing** (`??`) para proveer valores por defecto. El código debe ser *backward compatible* con documentos creados en versiones anteriores. DO NOT FAIL si falta un dato no crítico.
