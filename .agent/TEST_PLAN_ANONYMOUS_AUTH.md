# Plan de Pruebas: Autenticación Anónima

## Matriz de Escenarios

### Leyenda

- ✅ = Debe funcionar
- 🧪 = Requiere prueba manual
- 👤 = Usuario Google
- 📧 = Usuario Email
- 👻 = Usuario Anónimo (Invitado)

---

## 1. Flujos de Autenticación

| ID  | Escenario                             | Pasos                                             | Resultado Esperado                      |
| --- | ------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| A1  | 👻 Registro invitado directo          | Landing → "Jugar como invitado" → Ingresar nombre | Accede al lobby con avatar de iniciales |
| A2  | 👻 Registro invitado desde invitación | Link con gameId → "Jugar como invitado" → Nombre  | Entra directamente a la partida         |
| A3  | 👤 Login Google directo               | Landing → "Continuar con Google"                  | Accede al lobby con foto de Google      |
| A4  | 👤 Login Google desde invitación      | Link con gameId → "Continuar con Google"          | Entra directamente a la partida         |
| A5  | 📧 Login Email directo                | Landing → "Continuar con Email" → Login           | Accede al lobby                         |
| A6  | 📧 Login Email desde invitación       | Link con gameId → "Continuar con Email" → Login   | Entra directamente a la partida         |
| A7  | 📧 Registro Email nuevo               | Landing → Email → Crear cuenta                    | Accede al lobby con avatar de iniciales |

---

## 2. Creación de Partida

| ID  | Escenario       | Host     | Resultado Esperado                     |
| --- | --------------- | -------- | -------------------------------------- |
| C1  | 👻 crea partida | Invitado | Partida creada, puede invitar, es host |
| C2  | 👤 crea partida | Google   | Partida creada, puede invitar, es host |
| C3  | 📧 crea partida | Email    | Partida creada, puede invitar, es host |

---

## 3. Unirse a Partida (Combinaciones de Host + Invitado)

| ID  | Host | Jugador que se une | Resultado Esperado                         |
| --- | ---- | ------------------ | ------------------------------------------ |
| J1  | 👤   | 👻                 | Invitado entra, aparece con iniciales      |
| J2  | 👤   | 👤                 | Usuario Google entra con foto              |
| J3  | 👤   | 📧                 | Usuario Email entra con iniciales          |
| J4  | 👻   | 👤                 | Usuario Google entra a partida de invitado |
| J5  | 👻   | 👻                 | Dos invitados en la misma partida          |
| J6  | 👻   | 📧                 | Usuario Email entra a partida de invitado  |
| J7  | 📧   | 👻                 | Invitado entra a partida de Email          |

---

## 4. Durante Partida (Funcionalidad Core)

| ID  | Escenario               | Jugador | Resultado Esperado                      |
| --- | ----------------------- | ------- | --------------------------------------- |
| P1  | Impostor asignado       | 👻      | Puede ver que es impostor               |
| P2  | Jugador normal asignado | 👻      | Ve la palabra secreta                   |
| P3  | Votar                   | 👻      | Voto registrado correctamente           |
| P4  | Recibir votos           | 👻      | Es votado, se muestra correctamente     |
| P5  | Ser eliminado           | 👻      | Se muestra eliminado, pasa a espectador |
| P6  | Ganar como impostor     | 👻      | Puntos asignados, avatar en podio       |
| P7  | Ganar como jugador      | 👻      | Puntos asignados, avatar en podio       |
| P8  | Pantalla de resultados  | 👻      | Avatar con iniciales visible            |

---

## 5. Reconexión

| ID  | Escenario                        | Pasos                       | Resultado Esperado                          |
| --- | -------------------------------- | --------------------------- | ------------------------------------------- |
| R1  | 👻 recarga página en lobby       | Refrescar en /lobby         | Sigue autenticado, puede crear/unirse       |
| R2  | 👻 recarga página en partida     | Refrescar durante partida   | Reconecta a la partida, mantiene estado     |
| R3  | 👻 cierra y reabre pestaña       | Cerrar pestaña, abrir nueva | Sesión mantenida (mismo UID)                |
| R4  | 👻 pierde conexión temporalmente | Desconectar WiFi 5s         | Reconecta automáticamente                   |
| R5  | 👻 pierde conexión larga         | Desconectar WiFi 30s+       | Muestra como desconectado, puede reconectar |

---

## 6. Abandono de Partida

| ID  | Escenario                  | Resultado Esperado                         |
| --- | -------------------------- | ------------------------------------------ |
| L1  | 👻 abandona en lobby       | Sale de partida, vuelve a lobby vacío      |
| L2  | 👻 abandona durante juego  | Sale, otros jugadores ven "Desconectado"   |
| L3  | 👻 abandona siendo host    | ¿Se asigna nuevo host? ¿Se cierra partida? |
| L4  | 👻 último jugador abandona | Partida se cierra/limpia                   |

---

## 7. Interacciones Mixtas

| ID  | Escenario                      | Resultado Esperado         |
| --- | ------------------------------ | -------------------------- |
| M1  | Partida 4 jugadores: 2👤 + 2👻 | Todos funcionan igual      |
| M2  | 👻 host inicia partida         | Partida inicia normalmente |
| M3  | Solo 👻 pueden votar           | Votación funciona          |
| M4  | 👻 es el único ganador         | Podio muestra iniciales    |
| M5  | Empate entre 👤 y 👻           | Ambos en podio             |

---

## 8. Edge Cases

| ID  | Escenario                               | Resultado Esperado             |
| --- | --------------------------------------- | ------------------------------ |
| E1  | 👻 con nombre vacío                     | Validación impide registro     |
| E2  | 👻 con nombre muy largo (>30)           | Validación impide registro     |
| E3  | 👻 con nombre de 2 caracteres           | Permitido, iniciales correctas |
| E4  | 👻 intenta unirse a partida inexistente | Error "Enlace no válido"       |
| E5  | 👻 intenta unirse a partida en curso    | Error "Partida ya iniciada"    |
| E6  | 👻 con emojis en nombre                 | Debería funcionar              |
| E7  | 👻 con caracteres especiales            | Debería funcionar              |
| E8  | Dos 👻 con mismo nombre                 | Permitido (diferentes UIDs)    |

---

## 9. Cierre de Sesión

| ID  | Escenario                         | Resultado Esperado                   |
| --- | --------------------------------- | ------------------------------------ |
| S1  | 👻 hace logout                    | Vuelve a landing, UID se pierde      |
| S2  | 👻 hace logout durante partida    | Sale de partida y cierra sesión      |
| S3  | 👻 cierra navegador completamente | Sesión perdida (nuevo UID al volver) |

---

## Checklist de Ejecución

### Prioridad Alta (Críticos)

- [ ] A1 - Registro invitado directo
- [ ] A2 - Registro invitado desde invitación
- [ ] J1 - Usuario Google invita a anónimo
- [ ] J5 - Dos anónimos en misma partida
- [ ] P1-P8 - Funcionalidad core de juego
- [ ] R2 - Reconexión durante partida

### Prioridad Media

- [ ] C1 - Anónimo crea partida
- [ ] L1-L4 - Escenarios de abandono
- [ ] M1-M5 - Interacciones mixtas

### Prioridad Baja

- [ ] E1-E8 - Edge cases
- [ ] S1-S3 - Cierre de sesión

---

## Instrucciones de Prueba

1. **Preparar entorno**: `npm run dev`
2. **Abrir 2-4 navegadores/ventanas incógnito** distintas
3. **Ejecutar cada escenario** marcando ✅ o ❌
4. **Documentar errores** con captura de pantalla y logs de consola
