import React from 'react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Modal } from './ui/Modal';

export function UIShowcase() {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 pb-8 border-b border-white/10">
          <h1 className="text-5xl font-bold text-orange-400" style={{fontFamily: 'Trocchi, serif'}}>
            UI Showcase
          </h1>
          <p className="text-neutral-400">Muestrario de componentes y estilos de "El Impostor"</p>
        </div>

        {/* Tipografía */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Tipografía
          </h2>
          
          <div className="space-y-6 bg-white/5 rounded-xl p-6">
            <div>
              <p className="text-sm text-neutral-500 mb-2">Trocchi (Headings)</p>
              <h1 className="text-5xl" style={{fontFamily: 'Trocchi, serif'}}>El Impostor - Heading 1</h1>
            </div>
            
            <div>
              <p className="text-sm text-neutral-500 mb-2">Trocchi H2</p>
              <h2 className="text-4xl" style={{fontFamily: 'Trocchi, serif'}}>Resultado de la partida</h2>
            </div>
            
            <div>
              <p className="text-sm text-neutral-500 mb-2">Trocchi H3</p>
              <h3 className="text-3xl" style={{fontFamily: 'Trocchi, serif'}}>Ronda 1</h3>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-neutral-500 mb-2">Body Text - Regular</p>
              <p className="text-base text-neutral-300">Este es el texto normal del cuerpo. Se usa para mensajes, descripciones y contenido general.</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500 mb-2">Body Text - Large</p>
              <p className="text-lg text-neutral-300">Texto más grande para mayor énfasis en mensajes importantes.</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500 mb-2">Body Text - Small</p>
              <p className="text-sm text-neutral-400">Texto pequeño para información secundaria y metadatos.</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500 mb-2">Monospace (Códigos)</p>
              <p className="text-sm font-mono font-semibold text-neutral-300">ABC123</p>
            </div>
          </div>
        </section>

        {/* Colores */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Paleta de Colores
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-orange-400 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Orange 400 (Primary)</p>
              <code className="text-xs text-neutral-500">#fb923c</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-orange-700 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Orange 700 (Buttons)</p>
              <code className="text-xs text-neutral-500">#c2410c</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-neutral-950 border border-white/20 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Neutral 950 (Background)</p>
              <code className="text-xs text-neutral-500">#0a0a0a</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-neutral-900 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Neutral 900 (Cards)</p>
              <code className="text-xs text-neutral-500">#171717</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-red-500 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Red 500 (Danger)</p>
              <code className="text-xs text-neutral-500">#ef4444</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-green-500 rounded-lg"></div>
              <p className="text-sm text-neutral-400">Green 500 (Success)</p>
              <code className="text-xs text-neutral-500">#22c55e</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-white/5 border border-white/10 rounded-lg"></div>
              <p className="text-sm text-neutral-400">White/5 (Subtle BG)</p>
              <code className="text-xs text-neutral-500">rgba(255,255,255,0.05)</code>
            </div>
            
            <div className="space-y-2">
              <div className="h-20 bg-white/10 border border-white/20 rounded-lg"></div>
              <p className="text-sm text-neutral-400">White/10 (Hover)</p>
              <code className="text-xs text-neutral-500">rgba(255,255,255,0.1)</code>
            </div>
          </div>
        </section>

        {/* Botones */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Botones
          </h2>
          
          <div className="space-y-8">
            {/* Variantes */}
            <div className="space-y-4">
              <h3 className="text-xl text-neutral-300 font-semibold">Variantes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                <div className="space-y-2">
                  <Button variant="primary">Primary Button</Button>
                  <code className="block text-xs text-neutral-500">variant="primary"</code>
                </div>
                
                <div className="space-y-2">
                  <Button variant="secondary">Secondary Button</Button>
                  <code className="block text-xs text-neutral-500">variant="secondary"</code>
                </div>
                
                <div className="space-y-2">
                  <Button variant="danger">Danger Button</Button>
                  <code className="block text-xs text-neutral-500">variant="danger"</code>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline">Outline Button</Button>
                  <code className="block text-xs text-neutral-500">variant="outline"</code>
                </div>
                
                <div className="space-y-2">
                  <Button variant="ghost">Ghost Button</Button>
                  <code className="block text-xs text-neutral-500">variant="ghost"</code>
                </div>
                
                <div className="space-y-2">
                  <Button disabled>Disabled Button</Button>
                  <code className="block text-xs text-neutral-500">disabled</code>
                </div>
              </div>
            </div>

            {/* Tamaños */}
            <div className="space-y-4">
              <h3 className="text-xl text-neutral-300 font-semibold">Tamaños</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                <div className="space-y-2">
                  <Button size="sm">Small Button</Button>
                  <code className="block text-xs text-neutral-500">size="sm"</code>
                </div>
                
                <div className="space-y-2">
                  <Button size="md">Medium Button</Button>
                  <code className="block text-xs text-neutral-500">size="md" (default)</code>
                </div>
                
                <div className="space-y-2">
                  <Button size="lg">Large Button</Button>
                  <code className="block text-xs text-neutral-500">size="lg"</code>
                </div>
              </div>
            </div>

            {/* Con iconos */}
            <div className="space-y-4">
              <h3 className="text-xl text-neutral-300 font-semibold">Con Iconos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <Button variant="primary" className="gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Crear juego</span>
                </Button>
                
                <Button variant="outline" className="gap-2">
                  <span>Compartir enlace</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Spinners */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Spinners
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white/5 rounded-xl p-6">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="sm" />
              <code className="text-xs text-neutral-500">size="sm"</code>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Spinner size="md" />
              <code className="text-xs text-neutral-500">size="md"</code>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <code className="text-xs text-neutral-500">size="lg"</code>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Badges
          </h2>
          
          <div className="flex flex-wrap gap-4 bg-white/5 rounded-xl p-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full">
                <span className="text-sm font-semibold text-orange-400">Partida 1 de 3</span>
              </div>
              <code className="block text-xs text-neutral-500">Badge naranja (info)</code>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                <span className="text-sm font-semibold text-green-400">Conectado</span>
              </div>
              <code className="block text-xs text-neutral-500">Badge verde (success)</code>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full">
                <span className="text-sm font-semibold text-red-400">Eliminado</span>
              </div>
              <code className="block text-xs text-neutral-500">Badge rojo (danger)</code>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <span className="text-sm font-semibold text-neutral-300">Neutral</span>
              </div>
              <code className="block text-xs text-neutral-500">Badge neutral</code>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">Card Simple</h3>
                <p className="text-neutral-400">Fondo sutil con opacidad 5% de blanco.</p>
              </div>
              <code className="block text-xs text-neutral-500">bg-white/5 rounded-xl p-6</code>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-md border border-white/10">
                <h3 className="text-xl font-bold mb-2">Card con Blur</h3>
                <p className="text-neutral-400">Fondo con blur y borde sutil.</p>
              </div>
              <code className="block text-xs text-neutral-500">backdrop-blur-md border border-white/10</code>
            </div>
            
            <div className="space-y-2">
              <div className="bg-neutral-900 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">Card Sólida</h3>
                <p className="text-neutral-400">Fondo sólido neutral-900 para modales.</p>
              </div>
              <code className="block text-xs text-neutral-500">bg-neutral-900 rounded-xl p-6</code>
            </div>
            
            <div className="space-y-2">
              <div className="bg-orange-500/10 rounded-xl p-6 border border-orange-500/30">
                <h3 className="text-xl font-bold text-orange-400 mb-2">Card Destacada</h3>
                <p className="text-neutral-400">Para información importante.</p>
              </div>
              <code className="block text-xs text-neutral-500">bg-orange-500/10 border-orange-500/30</code>
            </div>
          </div>
        </section>

        {/* Dividers */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Divisores
          </h2>
          
          <div className="space-y-6 bg-white/5 rounded-xl p-6">
            <div className="space-y-4">
              <p className="text-neutral-300">Contenido superior</p>
              <div className="border-t border-white/5"></div>
              <p className="text-neutral-300">Divisor sutil (white/5)</p>
              <code className="block text-xs text-neutral-500">border-t border-white/5</code>
            </div>
            
            <div className="space-y-4">
              <p className="text-neutral-300">Contenido superior</p>
              <div className="border-t border-white/10"></div>
              <p className="text-neutral-300">Divisor medio (white/10)</p>
              <code className="block text-xs text-neutral-500">border-t border-white/10</code>
            </div>
            
            <div className="space-y-4">
              <p className="text-neutral-300">Contenido superior</p>
              <div className="border-t border-neutral-700"></div>
              <p className="text-neutral-300">Divisor visible (neutral-700)</p>
              <code className="block text-xs text-neutral-500">border-t border-neutral-700</code>
            </div>
          </div>
        </section>

        {/* Modal */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Modal
          </h2>
          
          <div className="space-y-4">
            <Button onClick={() => setShowModal(true)}>Abrir Modal</Button>
            
            {showModal && (
              <Modal onClose={() => setShowModal(false)}>
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold">Modal de Ejemplo</h3>
                  <p className="text-neutral-400">
                    Este es un modal con fondo oscuro, backdrop blur y animaciones suaves.
                  </p>
                  <Button onClick={() => setShowModal(false)}>Cerrar</Button>
                </div>
              </Modal>
            )}
            
            <code className="block text-xs text-neutral-500 bg-black/30 p-4 rounded">
              {`<Modal onClose={handleClose}>
  <div>Contenido del modal</div>
</Modal>`}
            </code>
          </div>
        </section>

        {/* Inputs y Forms */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Inputs
          </h2>
          
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Input estándar</label>
              <input 
                type="text" 
                placeholder="Introduce el código del juego"
                className="w-full h-12 px-4 rounded-md bg-white/10 border border-transparent focus:border-neutral-500 focus:ring-neutral-500 focus:outline-none text-center uppercase tracking-widest text-sm"
              />
              <code className="block text-xs text-neutral-500">bg-white/10 focus:border-neutral-500</code>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Input con error</label>
              <input 
                type="text" 
                placeholder="Campo requerido"
                className="w-full h-12 px-4 rounded-md bg-red-900/20 border border-red-500/50 focus:border-red-500 focus:outline-none"
              />
              <p className="text-sm text-red-400">Este campo es obligatorio</p>
              <code className="block text-xs text-neutral-500">bg-red-900/20 border-red-500/50</code>
            </div>
          </div>
        </section>

        {/* Animaciones */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-neutral-50 pb-2 border-b border-white/5" style={{fontFamily: 'Trocchi, serif'}}>
            Animaciones
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">Fade In</h3>
              <div className="animate-fadeIn bg-orange-500/20 rounded-lg p-4 text-center">
                Aparece con fade
              </div>
              <code className="block text-xs text-neutral-500">animate-fadeIn</code>
            </div>
            
            <div className="space-y-4 bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">Scale In</h3>
              <div className="animate-scaleIn bg-orange-500/20 rounded-lg p-4 text-center">
                Aparece con escala
              </div>
              <code className="block text-xs text-neutral-500">animate-scaleIn</code>
            </div>
            
            <div className="space-y-4 bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">Con Delay</h3>
              <div className="animate-fadeIn animate-delay-500 bg-orange-500/20 rounded-lg p-4 text-center">
                Delay 500ms
              </div>
              <code className="block text-xs text-neutral-500">animate-delay-500</code>
            </div>
            
            <div className="space-y-4 bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">Active Scale</h3>
              <button className="w-full bg-orange-700 rounded-lg p-4 text-center active:scale-95 transition-transform">
                Presiona para ver efecto
              </button>
              <code className="block text-xs text-neutral-500">active:scale-95</code>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-neutral-500 text-sm pt-8 border-t border-white/5">
          <p>UI Showcase - El Impostor © 2025</p>
          <p className="mt-2">Acceso exclusivo para desarrollo</p>
        </div>
      </div>
    </div>
  );
}

