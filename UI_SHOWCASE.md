# UI Showcase - El Impostor

## Acceso

La página de showcase está protegida y solo puede ser accedida por el usuario autorizado: **leandrovegasb@gmail.com**

### URL de acceso

```
http://localhost:5173/ui-showcase
```

O en producción:

```
https://tu-dominio.com/ui-showcase
```

## Contenido

El showcase incluye una documentación visual completa de:

### 1. Tipografía
- **Trocchi** (serif) - Usado para todos los encabezados (h1-h6)
- Texto de cuerpo en diferentes tamaños (base, large, small)
- Texto monoespaciado para códigos

### 2. Paleta de Colores
- **Primary**: Orange 400, Orange 700
- **Neutrals**: Neutral 950 (background), Neutral 900 (cards)
- **Semantic**: Red 500 (danger), Green 500 (success)
- **Overlays**: White/5, White/10, White/20

### 3. Componentes

#### Botones (`<Button />`)
- **Variantes**: primary, secondary, danger, outline, ghost, disabled
- **Tamaños**: sm, md (default), lg
- Ejemplos con iconos

#### Spinners (`<Spinner />`)
- **Tamaños**: sm, md, lg
- Animación de carga

#### Modal (`<Modal />`)
- Backdrop blur
- Animaciones suaves
- Overlay oscuro

#### Badges
- Badge naranja (info)
- Badge verde (success)
- Badge rojo (danger)
- Badge neutral

### 4. Cards
- Card simple (bg-white/5)
- Card con blur (backdrop-blur-md)
- Card sólida (bg-neutral-900)
- Card destacada (bg-orange-500/10)

### 5. Divisores
- Divisor sutil (white/5)
- Divisor medio (white/10)
- Divisor visible (neutral-700)

### 6. Inputs
- Input estándar
- Input con estado de error

### 7. Animaciones
- `animate-fadeIn` - Aparición con fade
- `animate-scaleIn` - Aparición con escala
- `animate-delay-XXX` - Delays escalonados (100-1000ms)
- `active:scale-95` - Efecto al presionar
- `animate-cardEntrance` - Animación especial de carta
- `animate-card-float` - Flotación continua
- `animate-tilt-oscillate` - Oscilación 3D

## Seguridad

- La ruta está protegida por autenticación de Firebase
- Solo el email `leandrovegasb@gmail.com` tiene acceso
- Cualquier otro usuario verá un mensaje de "Acceso Denegado"
- Los usuarios no autenticados serán redirigidos al login

## Desarrollo

Para modificar el showcase, edita:

```
client/src/components/UIShowcase.jsx
```

Para cambiar los permisos de acceso, edita la condición en:

```javascript
// client/src/App.jsx
if (user.email !== 'leandrovegasb@gmail.com') {
  // ...
}
```

