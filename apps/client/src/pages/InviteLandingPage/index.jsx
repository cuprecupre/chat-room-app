import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { InvitationCard } from "../../components/InvitationCard";
import { useGameInvite } from "../../hooks/useGameInvite";
import { ROUTES } from "../../routes/routes";

/**
 * InviteLandingPage - Invitation screen for NON-authenticated users
 * Shows login options (Google/Email/Guest) when accessing a game via shared link
 */
export function InviteLandingPage({ onLogin, onGoToEmailAuth, isLoading }) {
    const navigate = useNavigate();
    const { urlGameId, previewHostName, error } = useGameInvite();

    // Handle cancel - go to landing page
    const handleCancel = () => {
        const url = new URL(window.location);
        url.searchParams.delete("gameId");
        window.history.replaceState({}, "", url.toString());
        navigate(ROUTES.HOME);
    };

    // Handle email auth - preserve gameId in URL
    const handleGoToEmailAuth = () => {
        // Navigate to auth page with gameId preserved
        navigate(`${ROUTES.AUTH}?gameId=${urlGameId}`);
    };

    // Handle guest auth - preserve gameId in URL
    const handleGoToGuestAuth = () => {
        navigate(`${ROUTES.GUEST_AUTH}?gameId=${urlGameId}`);
    };

    // Error state: Game not found
    if (error === "NOT_FOUND") {
        return (
            <InvitationCard
                gameId={urlGameId}
                title="Enlace no válido"
                subtitle="No encontramos esta partida. Es posible que el anfitrión la haya cerrado o el enlace sea incorrecto."
                isError={true}
            >
                <Button onClick={handleCancel} variant="primary" className="w-full">
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    // Error state: Game in progress
    if (error === "IN_PROGRESS") {
        return (
            <InvitationCard
                gameId={urlGameId}
                title="Partida ya iniciada"
                subtitle="Lo sentimos, esta partida ya comenzó y no acepta nuevos jugadores en este momento."
                isError={true}
            >
                <Button onClick={handleCancel} variant="primary" className="w-full">
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    // Normal invitation screen with login buttons
    return (
        <InvitationCard
            hostName={previewHostName}
            gameId={urlGameId}
            title="¡Te han invitado!"
            subtitle="¿Quieres entrar ahora?"
        >
            {/* Guest Login Button */}
            <Button
                onClick={handleGoToGuestAuth}
                disabled={isLoading}
                variant="primary"
                size="lg"
                className="w-full h-14 text-base rounded-full"
            >
                <span className="align-middle font-semibold">Jugar como invitado</span>
            </Button>

            {/* Google Login Button - Same style as LandingPage */}
            <Button
                onClick={onLogin}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-none w-full h-14 text-base backdrop-blur-sm rounded-full"
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
                            <g clipPath="url(#clip0_invite_google)">
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
                                <clipPath id="clip0_invite_google">
                                    <rect width="16" height="16" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
                    )}
                </span>
                <span className="align-middle font-semibold">Continuar con Google</span>
            </Button>

            {/* Temporarily hidden - Email Login
            <Button
                onClick={handleGoToEmailAuth}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-none w-full h-14 text-base backdrop-blur-sm rounded-full"
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
                <span className="align-middle font-semibold">Continuar con Email</span>
            </Button>
            */}

            {/* Cancel Button */}
            <Button
                onClick={handleCancel}
                variant="ghost"
                size="md"
                className="w-full text-neutral-500 hover:text-neutral-300"
            >
                Cancelar
            </Button>
        </InvitationCard>
    );
}
