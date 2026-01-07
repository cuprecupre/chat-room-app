import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Limpiar cualquier Service Worker registrado anteriormente
// Esto fuerza a los usuarios a obtener contenido fresco
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            registration.unregister();
            console.log("🧹 Service Worker eliminado:", registration.scope);
        });
    });
}

console.log(import.meta.env.DEV);
// Inicializar Eruda para debug móvil (solo si VITE_ENABLE_ERUDA=true)
if (import.meta.env.DEV === "true") {
    import("eruda")
        .then((eruda) => {
            eruda.default.init();
            console.log("🔧 Eruda debug mode activado");
            console.log(
                "📱 Para ver los logs, toca el ícono de Eruda en la esquina inferior derecha"
            );
        })
        .catch((error) => {
            console.error("❌ Error al cargar Eruda:", error);
        });
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Hide initial loader once React has mounted and CSS is loaded
// Use requestAnimationFrame to ensure browser has painted
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        const loader = document.getElementById("initial-loader");
        if (loader) {
            loader.style.opacity = "0";
            loader.style.transition = "opacity 0.2s ease-out";
            setTimeout(() => loader.remove(), 200);
        }
    });
});
