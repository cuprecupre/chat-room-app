# Guía para Añadir Palabras y Categorías

Este documento describe las reglas y proceso para añadir nuevas palabras al juego.

## Ubicación del archivo

```
apps/server/data/words.json
```

## Estructura del archivo

```json
{
    "Nombre de Categoría": [
        "palabra1",
        "palabra2",
        "palabra3"
    ],
    "Otra Categoría": [
        "palabra1",
        "palabra2"
    ]
}
```

---

## Reglas para las palabras

### ✅ Palabras válidas

| Criterio | Descripción |
|----------|-------------|
| **Español neutro** | Palabras entendidas en todos los países hispanohablantes |
| **Sin regionalismos** | Evitar palabras que solo se usan en un país o región |
| **Sin lunfardos** | No usar jerga local (ej: "pibe", "guagua", "plata" como dinero) |
| **Universales** | Cualquier hispanohablante debería conocer la palabra |
| **Sustantivos preferidos** | Priorizar sustantivos sobre verbos o adjetivos |
| **Minúsculas** | Todas las palabras en minúsculas (excepto nombres propios) |

### ❌ Palabras a evitar

| Evitar | Usar en su lugar |
|--------|-----------------|
| carro | automóvil, coche |
| pibe, chaval | chico, joven |
| guagua, camión, colectivo | autobús |
| plata (dinero) | dinero |
| computador | computadora, ordenador |
| celular | teléfono móvil |
| pollera | falda |
| chompa | suéter, jersey |
| frutilla | fresa |
| durazno | melocotón |

### Casos especiales

- **Sinónimos regionales**: Si ambas variantes son muy comunes, incluir ambas (ej: "zumo" y "jugo")
- **Nombres propios**: Solo si son universalmente conocidos (países, ciudades principales)
- **Marcas**: NO incluir marcas comerciales
- **Palabras compuestas**: Preferir palabras simples de una sola palabra

---

## Proceso para añadir palabras

### 1. Crear una rama

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-words-[descripcion]
```

### 2. Editar el archivo

Abrir `apps/server/data/words.json` y:
- Añadir palabras a categorías existentes
- O crear nuevas categorías

### 3. Validar el JSON

```bash
node -e "require('./apps/server/data/words.json'); console.log('JSON válido')"
```

### 4. Verificar cantidad de palabras

```bash
node -e "const w = require('./apps/server/data/words.json'); Object.keys(w).forEach(c => console.log(c + ':', w[c].length))"
```

### 5. Buscar duplicados

```bash
node -e "
const w = require('./apps/server/data/words.json');
const all = Object.values(w).flat();
const duplicates = all.filter((item, index) => all.indexOf(item) !== index);
if (duplicates.length > 0) {
    console.log('Duplicados encontrados:', [...new Set(duplicates)]);
} else {
    console.log('No hay duplicados');
}
"
```

### 6. Commit y push

```bash
git add apps/server/data/words.json
git commit -m "feat: add words to [categoría] category"
git push origin feature/add-words-[descripcion]
```

### 7. Crear Pull Request

Crear PR hacia `develop` para revisión.

---

## Estadísticas actuales

| Métrica | Valor |
|---------|-------|
| Categorías | 30 |
| Palabras por categoría | 100 |
| Total palabras | 3,000 |
| Tamaño archivo | ~60 KB |

---

## Categorías existentes

1. Naturaleza
2. Cuerpo humano
3. Colores
4. Números
5. Familia y personas
6. Profesiones
7. Objetos del hogar
8. Tecnología
9. Transporte
10. Herramientas
11. Materiales
12. Deportes
13. Animales
14. Alimentos
15. Lugares
16. Verbos comunes
17. Emociones
18. Ropa y accesorios
19. Instrumentos musicales
20. Fantasía y mitología
21. Espacio y astronomía
22. Bebidas y postres
23. Superpoderes
24. Cine y espectáculos
25. Escuela y oficina
26. Geografía y países
27. Salud y medicina
28. Eventos y festividades
29. Viajes y turismo
30. Ciencia y laboratorio

---

## Ideas para nuevas categorías

- Arquitectura y construcción
- Jardinería y plantas
- Juguetes y juegos
- Muebles y decoración
- Clima y fenómenos naturales
- Idiomas y comunicación
- Matemáticas y geometría
- Química y elementos
- Religión y espiritualidad
- Militar y defensa
