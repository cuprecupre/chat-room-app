import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyES() {
    return (
        <div className="prose prose-invert prose-neutral max-w-none space-y-8">
            <p className="text-neutral-400 text-lg">
                Última actualización: Enero 2026
            </p>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">1. Responsable del tratamiento</h2>
                <p className="text-neutral-300 leading-relaxed">
                    El responsable del tratamiento de los datos recogidos en este sitio web es:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Nombre:</strong> Leandro Vegas</li>
                    <li><strong>Sitio web:</strong> impostor.me</li>
                    <li><strong>Email de contacto:</strong> elimpostorjuego@gmail.com</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">2. Datos que recopilamos</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Recopilamos los siguientes tipos de datos:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Datos de cuenta:</strong> Nombre de usuario, email (si inicias sesión con Google) o nombre elegido (si juegas como invitado).</li>
                    <li><strong>Datos de uso:</strong> Información sobre cómo interactúas con el juego (partidas jugadas, acciones dentro del juego).</li>
                    <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, dispositivo y sistema operativo.</li>
                    <li><strong>Cookies:</strong> Utilizamos cookies propias y de terceros. Consulta nuestra <Link to="/cookies" className="text-orange-400 hover:text-orange-300 underline">Política de Cookies</Link> para más información.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">3. Finalidad del tratamiento</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Utilizamos tus datos para:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li>Permitirte jugar y mantener tu sesión activa.</li>
                    <li>Mejorar la experiencia del juego y corregir errores.</li>
                    <li>Analizar el uso del sitio web mediante herramientas de analítica.</li>
                    <li>Mostrar publicidad personalizada (con tu consentimiento).</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">4. Base legal</h2>
                <p className="text-neutral-300 leading-relaxed">
                    El tratamiento de tus datos se basa en:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Ejecución del servicio:</strong> Para que puedas jugar necesitamos procesar ciertos datos.</li>
                    <li><strong>Consentimiento:</strong> Para cookies de analítica y publicidad, solicitamos tu consentimiento previo.</li>
                    <li><strong>Interés legítimo:</strong> Para mejorar nuestro servicio y garantizar la seguridad.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">5. Terceros y transferencias</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Utilizamos servicios de terceros que pueden procesar tus datos:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Google Firebase:</strong> Para autenticación y base de datos (Estados Unidos).</li>
                    <li><strong>Google Analytics:</strong> Para analítica web (Estados Unidos).</li>
                    <li><strong>Google AdSense:</strong> Para mostrar publicidad (Estados Unidos).</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed">
                    Estos proveedores cumplen con las garantías necesarias para transferencias internacionales de datos según el RGPD.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">6. Conservación de datos</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Conservamos tus datos mientras mantengas tu cuenta activa o mientras sea necesario para prestarte el servicio.
                    Los datos de partidas se eliminan automáticamente tras su finalización.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">7. Tus derechos</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Tienes derecho a:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Acceso:</strong> Solicitar información sobre los datos que tenemos sobre ti.</li>
                    <li><strong>Rectificación:</strong> Corregir datos inexactos.</li>
                    <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos.</li>
                    <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos.</li>
                    <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado.</li>
                    <li><strong>Retirar consentimiento:</strong> Puedes retirar tu consentimiento en cualquier momento.</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed">
                    Para ejercer estos derechos, contacta con nosotros en: <a href="mailto:elimpostorjuego@gmail.com" className="text-orange-400 hover:text-orange-300 underline">elimpostorjuego@gmail.com</a>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">8. Cambios en esta política</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos
                    mediante un aviso en el sitio web.
                </p>
            </section>
        </div>
    );
}
