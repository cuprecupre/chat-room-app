import { useState } from "react";
import { useTranslation } from "react-i18next";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

/**
 * InvitationCard - Shared UI component for invitation screens
 * Used by both InviteLandingPage (non-auth) and InvitePage (auth)
 */
export function InvitationCard({
    hostName,
    roomId,
    title,
    subtitle,
    isError = false,
    children,
}) {
    const { t } = useTranslation('common');

    // Default values if not provided, using translation keys
    const displayTitle = title || t('invite.title');
    const displaySubtitle = subtitle || t('invite.subtitle');

    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
            <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                {/* Image */}
                <div className="flex justify-center">
                    <div className="relative">
                        {/* Placeholder / Skeleton */}
                        <div
                            className={`absolute inset-0 rounded-full bg-neutral-800 animate-pulse transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                        />

                        <img
                            src={heroImg}
                            alt="Invitación"
                            onLoad={() => setIsLoaded(true)}
                            className={`w-24 h-24 rounded-full object-cover ring-4 shadow-2xl transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                                } ${isError ? "ring-red-500/20 grayscale" : "ring-orange-500/30"}`}
                        />
                        {isError && (
                            <div className="absolute -bottom-2 -right-2 bg-neutral-900 rounded-full p-2 border border-neutral-800">
                                <span className="text-2xl">🚫</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h2 className="text-3xl font-serif text-neutral-50 mb-4">{displayTitle}</h2>
                    <p className="text-neutral-300 text-lg leading-relaxed">
                        {!isError && (
                            <>
                                {t('invite.receivedLink')}{" "}
                                <span className="font-mono font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                                    {hostName || roomId}
                                </span>
                                .
                                <br />
                            </>
                        )}
                        <span className="text-sm text-neutral-500 mt-2 block">{displaySubtitle}</span>
                    </p>
                </div>

                {/* Action buttons (passed as children) */}
                <div className="space-y-3 pt-4">{children}</div>
            </div>
        </div>
    );
}
