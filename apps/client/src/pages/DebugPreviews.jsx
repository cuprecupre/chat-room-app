import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function DebugPreviews() {
    const [view, setView] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({
        overlays: true,
        results: false,
        gameOver: false,
        modals: false,
    });

    // Toggle category expansion
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Navigation Tree Structure
    const navTree = [
        {
            id: 'overlays',
            label: 'Overlays de Ronda',
            items: [
                { id: 'r1', label: 'Ronda 1' },
                { id: 'r2', label: 'Ronda 2' },
                { id: 'r3', label: 'Ronda 3' },
            ]
        },
        {
            id: 'results',
            label: 'Resultados de Ronda',
            items: [
                { id: 'result_elim_host', label: 'Eliminado (Host)' },
                { id: 'result_elim_guest', label: 'Eliminado (Guest)' },
                { id: 'result_tie_host', label: 'Empate (Host)' },
                { id: 'result_tie_guest', label: 'Empate (Guest)' },
            ]
        },
        {
            id: 'gameOver',
            label: 'Game Over',
            items: [
                { id: 'gameover_friend_host', label: 'Amigo Gana (Host)' },
                { id: 'gameover_friend_guest', label: 'Amigo Gana (Guest)' },
                { id: 'gameover_impostor_host', label: 'Impostor Gana (Host)' },
                { id: 'gameover_impostor_guest', label: 'Impostor Gana (Guest)' },
                { id: 'gameover_tie', label: 'Empate Final' },
            ]
        },
        {
            id: 'modals',
            label: 'Modales',
            items: [
                { id: 'modal_instructions', label: 'Instrucciones' },
                { id: 'modal_feedback', label: 'Feedback' },
                { id: 'modal_scoring', label: 'Puntuación' },
                { id: 'modal_endgame', label: 'Terminar Partida' },
                { id: 'modal_leave', label: 'Abandonar Partida' },
            ]
        },
    ];

    // Close preview
    const closePreview = () => setView(null);

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans">
            {/* Sidebar Navigation */}
            <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 overflow-y-auto z-50">
                <div className="p-4 border-b border-neutral-800">
                    <h1 className="text-xl font-bold text-orange-400">Debug Previews</h1>
                    <p className="text-xs text-neutral-500 mt-1">Todas las pantallas del juego</p>
                </div>

                <nav className="p-2">
                    {navTree.map((category) => (
                        <div key={category.id} className="mb-2">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                            >
                                <span className="font-medium text-sm">{category.label}</span>
                                {expandedCategories[category.id] ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>

                            {/* Category Items */}
                            {expandedCategories[category.id] && (
                                <div className="ml-2 mt-1 space-y-1">
                                    {category.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setView(item.id)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${view === item.id
                                                ? 'bg-orange-500/20 text-orange-400 border-l-2 border-orange-400'
                                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Reset Button */}
                <div className="p-4 border-t border-neutral-800 mt-auto">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-3 py-2 bg-red-900/50 hover:bg-red-900/70 rounded text-sm"
                    >
                        Recargar Página
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="ml-64 h-screen flex flex-col">
                {/* No selection message */}
                {!view && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-2xl text-neutral-500 mb-2">Selecciona una pantalla</p>
                            <p className="text-sm text-neutral-600">Usa el menú de la izquierda para navegar</p>
                        </div>
                    </div>
                )}

                {/* Preview Container with iframe */}
                {view && (
                    <iframe
                        src={`/debug/preview/${view}`}
                        className="w-full h-full border-0"
                        title="Preview"
                    />
                )}
            </div>
        </div>
    );
}
