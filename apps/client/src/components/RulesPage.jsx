import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import { RulesContent } from "./RulesContent";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

export function RulesPage() {
    const navigate = useNavigate();

    return (
        <div
            className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col select-text"
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
        >
            {/* Navbar Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={heroImg} alt="Logo El Impostor" className="w-8 h-8 rounded-full" />
                    <span className="text-xl font-normal font-serif tracking-wide text-neutral-100">
                        El Impostor
                    </span>
                </Link>
                <div>
                    <Button
                        onClick={() => navigate("/")}
                        variant="primary"
                        size="sm"
                        className="w-auto !px-6 !py-1 !h-9 text-sm rounded-full"
                    >
                        Jugar Ahora
                    </Button>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif text-white">
                            Reglas del Juego
                        </h2>
                        <p className="text-xl text-neutral-400 font-normal">
                            Aprende a detectar al Impostor o a engañar a todos sin ser descubierto.
                        </p>
                    </div>

                    <RulesContent />

                    <div className="pt-12 text-center">
                        <Button
                            onClick={() => navigate("/")}
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-500 text-white border-none shadow-lg h-14 text-lg font-bold transform hover:scale-105 transition-all duration-300 rounded-full flex items-center justify-center mx-auto"
                        >
                            Empezar Partida Gratis
                        </Button>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-neutral-500 text-sm border-t border-white/5">
                <p>© {new Date().getFullYear()} El Impostor. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
