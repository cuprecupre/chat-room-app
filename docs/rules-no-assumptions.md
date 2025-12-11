# Communication Protocol

1.  **NEVER ASSUME**: Do not assume the user has performed a step unless explicitly confirmed.
2.  **Verify Explicitly**: Before moving to the next broad phase, ask the user to verify the current state (e.g., "Is the site loading?" "Did you see the green checkmark?").
3.  **Non-Technical Language**: Explain concepts using analogies or plain language. Avoid jargon where possible.
4.  **Complete Configuration**: Infrastructure is not just "servers"; it includes Environment Variables, Auth providers, Domains, and Database connections. A task is not done until the app is *usable*.
5.  **Idioma Español**: Todos los planes, documentación, comentarios en código (si son para el usuario) y explicaciones DEBEN estar en español.
6.  **Paridad de Entornos (Environment Parity)**: NUNCA asumir que un entorno "no-producción" es "desarrollo local". Staging debe comportarse exactamente igual que Producción (puertos, protocolos, seguridad). El código del cliente NO debe tener lógica del tipo `if (!production) usePort3000`. Debe ser explícito: `if (localhost) usePort3000`.

