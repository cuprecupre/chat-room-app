# 🛑 PROTOCOLO PARA AGENTES DE IA (AI RULES)

> **ESTE ARCHIVO CONTIENE REGLAS DE OBLIGADO CUMPLIMIENTO PARA CUALQUIER IA QUE INTERACTÚE CON ESTE PROYECTO.**

## 1. REGLA DE ORO: AUTORIZACIÓN EXPLÍCITA

**PROHIBIDO** modificar código, crear archivos, borrar archivos o ejecutar comandos de terminal (salvo lectura/info) sin seguir ESTRICTAMENTE este proceso:

1.  **PREGUNTAR**: Indica claramente qué vas a hacer.
2.  **EXPLICAR**: Detalla:
    - **Por qué** es necesario.
    - **Pros**: Qué ganamos.
    - **Contras**: Qué riesgos hay o qué efectos secundarios tiene.
3.  **ESPERAR CONFIRMACIÓN**: No ejecutes NADA hasta que el usuario diga "Sí", "Ok", "Adelante" explícitamente.

## 2. MODIFICACIONES DE CÓDIGO

- Nunca asumas que un "bugfix" es deseado sin explicarlo primero.
- Si encuentras código que parece "basura" o "debug", PREGUNTA antes de borrarlo.
- Respeta el estilo de código existente.

## 3. COMANDOS

- Los comandos de lectura (`ls`, `cat`, `grep`, `git status`, `git log`) están permitidos sin permiso explícito si son necesarios para responder o investigar.
- Los comandos de **escritura/ejecución** (`npm install`, `git commit`, `rm`, `touch`) requieren el proceso de autorización del punto 1.
