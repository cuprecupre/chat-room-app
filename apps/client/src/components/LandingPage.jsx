import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import heroImg from "../assets/impostor-home.png";
import cardBackImg from "../assets/card-back.png";
import cardImg from "../assets/card.png";
import maskImg from "../assets/mascara.png";
import clockImg from "../assets/reloj.png";
import dualImpostorImg from "../assets/dual-impostor.png";
import avatarAlex from "../assets/avatar-alex.jpg";
import avatarSofia from "../assets/avatar-sofia.jpg";
import avatarJavi from "../assets/avatar-javi.jpg";
import avatarLucia from "../assets/avatar-lucia.jpg";
import avatarMarco from "../assets/avatar-marco.jpg";

export function LandingPage({
    onLogin,
    onGoToEmailAuth,
    isLoading,
    onOpenInstructions,
    onOpenFeedback,
}) {
    const featuresRef = useRef(null);
    const [currentReview, setCurrentReview] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const reviews = [
        {
            text: "La partida se puso tensísima cuando acusaron a María y resultó que yo era el impostor todo el tiempo. ¡Risas aseguradas!",
            author: "Alex, Jugador Frecuente",
            stars: 5,
            image: avatarAlex,
            gradient: "from-orange-400 to-red-600",
        },
        {
            text: "Lo mejor es que no hay que instalar nada. Mandas el link y en 10 segundos estamos todos jugando. Genial para romper el hielo.",
            author: "Sofía, Jugador Frecuente",
            stars: 5,
            image: avatarSofia,
            gradient: "from-purple-400 to-blue-600",
        },
        {
            text: "Simple pero adictivo. Las discusiones para encontrar al espía son lo mejor. Muy recomendado para noches de juegos.",
            author: "Javi, Jugador Frecuente",
            stars: 5,
            image: avatarJavi,
            gradient: "from-green-400 to-emerald-600",
        },
        {
            text: "Ideal para jugar con compañeros de trabajo en remoto. Nos reímos mucho y ayuda a desconectar del estrés del día a día.",
            author: "Lucía, Team Lead",
            stars: 5,
            image: avatarLucia,
            gradient: "from-pink-400 to-rose-600",
        },
        {
            text: "Increíble cómo un juego tan sencillo puede generar tanto debate. ¡Siempre acabamos gritando (de risa) al final de cada ronda!",
            author: "Marco, Estudiante",
            stars: 5,
            image: avatarMarco,
            gradient: "from-cyan-400 to-blue-500",
        },
    ];

    const faqs = [
        {
            question: "¿Qué es El Impostor?",
            answer: "Es un juego de deducción social donde todos reciben una palabra secreta excepto uno: el Impostor. ¿El objetivo? Descubrirlo antes de que él descubra la palabra.",
        },
        {
            question: "¿Necesito instalar algo?",
            answer: "No. El juego funciona directamente en el navegador de tu móvil, tablet o PC. Solo necesitas conexión a internet.",
        },
        {
            question: "¿Es gratis?",
            answer: "Sí, 100% gratuito. Sin compras ocultas ni anuncios molestos. Solo diversión pura.",
        },
        {
            question: "¿Cuántos jugadores pueden jugar?",
            answer: "Mínimo 4 jugadores son necesarios para que la dinámica funcione bien. Recomendamos grupos de entre 4 y 10 personas.",
        },
        {
            question: "¿Podemos jugar a distancia?",
            answer: "¡Claro! Podéis usar una videollamada (Zoom, Meet, Discord) para hablar y veros las caras, y usar la app para gestionar las cartas y votaciones.",
        },
        {
            question: "¿Dónde puedo ver las reglas completas?",
            answer: (
                <>
                    Puedes consultar todas las reglas del juego en nuestra{" "}
                    <a href="/reglas" className="text-orange-400 hover:text-orange-300 underline">
                        página de reglas
                    </a>
                    . Ahí encontrarás explicaciones detalladas sobre cómo jugar, puntuación y
                    consejos.
                </>
            ),
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentReview((prev) => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        document.documentElement.style.scrollBehavior = "smooth";
        return () => {
            document.documentElement.style.scrollBehavior = "auto";
        };
    }, []);

    const scrollToFeatures = () => {
        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden allow-select">
            {/* Navbar Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => window.scrollTo(0, 0)}
                >
                    <img src={heroImg} alt="Logo El Impostor" className="w-8 h-8 rounded-full" />
                    <span className="text-xl font-normal font-serif tracking-wide text-neutral-100">
                        El Impostor
                    </span>
                </div>
                <div className="hidden md:flex gap-6 items-center">
                    <button
                        onClick={scrollToFeatures}
                        className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Cómo se juega
                    </button>
                    <button
                        onClick={() => (window.location.href = "/reglas")}
                        className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Reglas
                    </button>
                </div>
                <div>
                    <Button
                        onClick={onLogin}
                        variant="primary"
                        size="sm"
                        className="w-auto !px-6 !py-1 !h-9 text-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <title>Google</title>
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#FFFFFF"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#FFFFFF"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                fill="#FFFFFF"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#FFFFFF"
                            />
                        </svg>
                        Jugar Ahora
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center text-center">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-amber-600/[0.08] md:bg-amber-600/15 rounded-full blur-[80px] md:blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-orange-600/[0.08] md:bg-orange-600/15 rounded-full blur-[90px] md:blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <div className="animate-scaleIn animate-delay-200 inline-block">
                        <div className="relative">
                            <img
                                src={heroImg}
                                alt="Icono del juego El Impostor"
                                className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover animate-tilt-oscillate shadow-2xl ring-1 ring-white/10"
                            />
                        </div>
                    </div>

                    <h2 className="flex flex-col items-center gap-3 md:gap-4 animate-fadeIn animate-delay-400 drop-shadow-2xl">
                        <span className="text-4xl md:text-6xl/tight lg:text-7xl/tight font-serif font-normal text-white">
                            El Impostor está entre nosotros.
                        </span>
                        <span className="text-3xl md:text-5xl font-serif font-normal tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600">
                            ¿Podrás descubrirlo?
                        </span>
                    </h2>

                    <div className="space-y-2 mt-2">
                        <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed animate-fadeIn animate-delay-500 font-light">
                            Inicia una partida, invita a tus amigos y sumérgete en el mejor juego de
                            deducción&nbsp;social.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10 animate-fadeIn animate-delay-600 w-full max-w-md mx-auto sm:max-w-none">
                        <div className="w-full sm:w-auto min-w-[240px]">
                            <Button
                                onClick={onLogin}
                                disabled={isLoading}
                                variant="outline"
                                size="lg"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-none px-8 w-full h-14 text-base backdrop-blur-sm rounded-full"
                            >
                                <span className="mr-3 inline-flex items-center justify-center align-middle">
                                    {isLoading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 16 16"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <g clipPath="url(#clip0_643_9687)">
                                                <path
                                                    d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z"
                                                    fill="#EA4335"
                                                />
                                                <path
                                                    d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z"
                                                    fill="#34A853"
                                                />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_643_9687">
                                                    <rect width="16" height="16" fill="white" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    )}
                                </span>
                                <span className="align-middle font-semibold">
                                    Continuar con Google
                                </span>
                            </Button>
                        </div>
                        <div className="w-full sm:w-auto min-w-[240px]">
                            <Button
                                onClick={onGoToEmailAuth}
                                disabled={isLoading}
                                variant="outline"
                                size="lg"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-none px-8 w-full h-14 text-base backdrop-blur-sm rounded-full"
                            >
                                <span className="mr-3 inline-flex items-center justify-center align-middle">
                                    <svg
                                        className="w-5 h-5 text-neutral-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </span>
                                <span className="align-middle font-semibold">
                                    Continuar con Email
                                </span>
                            </Button>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-center gap-8 text-sm text-neutral-500 animate-fadeIn animate-delay-800">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Gratis
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                            Sin instalación
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            Multijugador
                        </span>
                    </div>
                </div>
            </header>

            {/* Feature / Dynamics Section */}
            <section
                ref={featuresRef}
                className="py-32 px-6 relative bg-neutral-900/50 overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center mb-20 relative z-10">
                    <h1 className="text-xl md:text-2xl text-orange-400 font-sans font-normal leading-relaxed animate-fadeIn">
                        Juega ahora a El Impostor Online GRATIS con tus amigos.
                    </h1>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-serif font-normal text-neutral-100">
                            Cómo se juega a El Impostor
                        </h2>
                        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                            Una mecánica de roles ocultos fácil de aprender. Descubre quién miente
                            en partidas rápidas de deducción.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {/* Step 1 */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 h-[400px] md:h-[500px]">
                            {/* Background Image covering the entire card */}
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={cardImg}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Gradient Overlay: Bottom only */}
                            {/* Gradient Overlay: Bottom only, reduced height */}
                            <div className="absolute bottom-0 left-0 right-0 h-2/3 md:h-3/4 bg-gradient-to-t from-neutral-950 to-transparent z-0"></div>

                            {/* Content */}
                            <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-end">
                                <div className="mb-2">
                                    <span className="text-6xl md:text-8xl font-serif font-normal text-orange-500 group-hover:text-orange-400 transition-colors">
                                        1
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-sans font-semibold mb-4 text-white">
                                    Recibe tu palabra
                                </h3>
                                <p className="text-neutral-400 leading-relaxed text-lg">
                                    Todos reciben la misma palabra secreta, excepto el{" "}
                                    <strong className="text-orange-400 font-medium">
                                        Impostor
                                    </strong>
                                    . Él no sabe nada, pero debe fingir que sí.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 h-[400px] md:h-[500px]">
                            {/* Background Image covering the entire card */}
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={dualImpostorImg}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Gradient Overlay: Bottom only */}
                            {/* Gradient Overlay: Bottom only, reduced height */}
                            <div className="absolute bottom-0 left-0 right-0 h-2/3 md:h-3/4 bg-gradient-to-t from-neutral-950 to-transparent z-0"></div>

                            {/* Content */}
                            <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-end">
                                <div className="mb-2">
                                    <span className="text-6xl md:text-8xl font-serif font-normal text-orange-500 group-hover:text-orange-400 transition-colors">
                                        2
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-sans font-semibold mb-4 text-white">
                                    Describe y Debate
                                </h3>
                                <p className="text-neutral-400 leading-relaxed text-lg">
                                    Cada jugador da una pista sobre la palabra. El Impostor debe
                                    escuchar atentamente y mentir para no ser descubierto.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2 h-[400px] md:h-[500px]">
                            {/* Background Image covering the entire card */}
                            <div className="absolute inset-0 pointer-events-none">
                                <img
                                    src={clockImg}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Gradient Overlay: Bottom only */}
                            {/* Gradient Overlay: Bottom only, reduced height */}
                            <div className="absolute bottom-0 left-0 right-0 h-2/3 md:h-3/4 bg-gradient-to-t from-neutral-950 to-transparent z-0"></div>

                            {/* Content */}
                            <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-end">
                                <div className="mb-2">
                                    <span className="text-6xl md:text-8xl font-serif font-normal text-orange-500 group-hover:text-orange-400 transition-colors">
                                        3
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-sans font-semibold mb-4 text-white">
                                    Vota y Gana
                                </h3>
                                <p className="text-neutral-400 leading-relaxed text-lg">
                                    ¿Quién es el sospechoso? Vota para expulsarlo. Si atrapan al
                                    Impostor, ganan los amigos. ¡Si escapa, gana él!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Link to Rules */}
                    <div className="text-center mt-12">
                        <a
                            href="/reglas"
                            className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-lg"
                        >
                            <span>Ver reglas completas</span>
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* SEO Content & Selling Points */}
            <section className="py-32 px-6 md:px-12 bg-neutral-950 relative">
                <div className="max-w-6xl mx-auto space-y-24">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/2 space-y-8 relative z-10">
                            <h2 className="text-3xl md:text-5xl font-serif font-normal leading-tight">
                                El mejor juego para
                                <br />
                                reuniones online
                            </h2>
                            <p className="text-neutral-400 text-xl leading-relaxed">
                                Juega directamente en tu navegador web. Sin descargar apps, sin
                                instalaciones y compatible con todos los móviles.{" "}
                                <strong>El Impostor</strong> es la forma más rápida de empezar a
                                divertirse en grupo.
                            </p>

                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-neutral-300">
                                    <span className="text-green-500">✓</span> Partidas rápidas de
                                    5-10 minutos
                                </li>
                                <li className="flex items-center gap-3 text-neutral-300">
                                    <span className="text-green-500">✓</span> Sin directores de
                                    juego
                                </li>
                                <li className="flex items-center gap-3 text-neutral-300">
                                    <span className="text-green-500">✓</span> Totalmente gratis y
                                    sin anuncios molestos
                                </li>
                            </ul>
                        </div>
                        <div className="w-full md:w-1/2 relative perspective-1000 grid grid-cols-1 place-items-center">
                            {/* Dynamic background glow based on current review */}
                            <div className="col-start-1 row-start-1 w-full h-full transition-colors duration-1000 ease-in-out z-0">
                                <div
                                    className={`w-full h-full bg-gradient-to-tr ${reviews[currentReview].gradient} opacity-20 blur-[100px] rounded-full`}
                                />
                            </div>

                            {/* Hidden spacer to set minimum height based on longest content if needed, 
                                but since all are in grid, the tallest one dictates height naturally. 
                                We render all reviews stacked. */}
                            {reviews.map((review, index) => (
                                <div
                                    key={index}
                                    className={`col-start-1 row-start-1 w-full transition-all duration-700 ease-in-out ${
                                        index === currentReview
                                            ? "animate-verbatim-in z-10 relative"
                                            : "animate-verbatim-out z-0 pointer-events-none absolute" // Keep absolute for exiting items to prevent layout jumps if they were different sizes, or just relative if strictly stacking
                                    }`}
                                    // Note: If we want the container to ALWAYS hold the height of the TALLEST, we should make them all relative (grid items).
                                    // BUT, if we want them to cross-fade, one might need to be absolute to not push the other?
                                    // Actually in CSS Grid, overlapping items (col-start-1 row-start-1) Sit on top of each other without pushing.
                                    // So they act like layers. The grid cell grows to fit the tallest layer.
                                    // So we can remove 'absolute' from here entirely!
                                >
                                    <div
                                        className={`col-start-1 row-start-1 w-full transition-all duration-700 ease-in-out ${
                                            index === currentReview
                                                ? "animate-verbatim-in z-10 opacity-100"
                                                : "animate-verbatim-out z-0 opacity-0 pointer-events-none"
                                        }`}
                                    >
                                        <div className="bg-neutral-950 border border-white/5 p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl mx-auto max-w-2xl">
                                            <div className="flex flex-col gap-6">
                                                <div className="flex items-start gap-4 md:gap-5">
                                                    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-white/10 shadow-lg">
                                                        <img
                                                            src={review.image}
                                                            alt={review.author}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <p className="text-neutral-300 font-light text-lg leading-relaxed relative z-10 italic">
                                                            "{review.text}"
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                                    <span className="text-sm font-medium text-neutral-400 tracking-wide">
                                                        {review.author}
                                                    </span>
                                                    <div className="flex text-yellow-500/80 gap-0.5 text-sm">
                                                        {[...Array(review.stars)].map((_, i) => (
                                                            <span key={i}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="pt-24 pb-24 md:py-24 px-6 relative bg-neutral-950">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-serif font-normal mb-4 text-white">
                            Preguntas Frecuentes
                        </h2>
                        <p className="text-neutral-400">
                            Todo lo que necesitas saber antes de empezar a mentir.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${
                                    openFaq === index
                                        ? "bg-neutral-900 border-orange-500/50 ring-1 ring-orange-500/20"
                                        : "border-white/10 hover:border-orange-500/30 hover:bg-neutral-900/50"
                                }`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                >
                                    <span
                                        className={`text-lg font-medium transition-colors ${openFaq === index ? "text-white" : "text-neutral-300 group-hover:text-white"}`}
                                    >
                                        {faq.question}
                                    </span>
                                    <span
                                        className={`flex-shrink-0 ml-6 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/5 transition-all duration-300 ${openFaq === index ? "rotate-180 bg-orange-600 border-orange-500 text-white" : "text-neutral-400 group-hover:border-white/20"}`}
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </span>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        openFaq === index
                                            ? "max-h-48 opacity-100"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <div className="p-6 pt-0 text-neutral-300 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="pt-24 pb-32 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900/80 pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[300px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl relative">
                            <img src={heroImg} alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-normal mb-4 tracking-tight text-white">
                        ¿Listo para jugar?
                    </h2>
                    <p className="text-lg text-neutral-400 max-w-xl mx-auto">
                        Únete ahora y demuestra tus habilidades de decepción. No necesitas instalar
                        nada.
                    </p>
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={onLogin}
                            disabled={isLoading}
                            variant="outline"
                            className="bg-orange-600 border-orange-500 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20 px-8 h-12 text-base font-semibold transform hover:scale-105 transition-all duration-300 rounded-full w-auto"
                        >
                            <span className="mr-3 inline-flex items-center justify-center align-middle">
                                {isLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 16 16"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g clipPath="url(#clip0_643_9687_footer)">
                                            <path
                                                d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z"
                                                fill="white"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_643_9687_footer">
                                                <rect width="16" height="16" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                )}
                            </span>
                            <span className="align-middle font-semibold">
                                Empezar Partida Gratis
                            </span>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Main Footer */}
            <footer className="border-t border-white/5 py-12 px-6 bg-neutral-950">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center">
                        <span className="text-neutral-500 text-sm font-serif">
                            El Impostor © 2025
                        </span>
                    </div>
                    <div className="flex gap-8 text-sm text-neutral-500">
                        <button
                            onClick={() => (window.location.href = "/reglas")}
                            className="hover:text-neutral-300 transition-colors"
                        >
                            Reglas
                        </button>
                        <button
                            onClick={onOpenFeedback}
                            className="hover:text-neutral-300 transition-colors"
                        >
                            Contacto
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
