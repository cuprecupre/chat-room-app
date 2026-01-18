import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Spinner } from "./components/ui/Spinner";
import "./index.css";
import "./i18n"; // Initialize i18n before App
import App from "./App.jsx";

// Limpiar Service Workers solo una vez por sesión (legacy cleanup)
if ("serviceWorker" in navigator && !sessionStorage.getItem("sw-cleaned")) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
            registrations.forEach((registration) => {
                registration.unregister();
                console.log("🧹 Service Worker eliminado:", registration.scope);
            });
            sessionStorage.setItem("sw-cleaned", "true");
        }
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
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center bg-neutral-950">
                <Spinner size="lg" />
            </div>
        }>
            <App />
        </Suspense>
    </StrictMode>
);