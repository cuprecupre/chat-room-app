import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { Avatar } from "../components/ui/Avatar";

export function ProfilePage() {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stats, loading } = usePlayerStats(user?.uid);

    const formatPlayTime = (seconds) => {
        if (!seconds) return "0m";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="min-h-[60vh]">
            {/* Header con botón volver */}
            <div className="mt-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("profile.back", "Volver")}</span>
                </button>
            </div>

            {/* Perfil del usuario */}
            <div className="flex flex-col items-center mb-8">
                <Avatar
                    photoURL={user?.photoURL}
                    displayName={user?.displayName}
                    size="lg"
                    className="mb-4 w-20 h-20"
                />
                <h1 className="text-2xl font-bold text-white mb-1">
                    {user?.displayName || t("profile.anonymous", "Jugador")}
                </h1>
                {user?.email && (
                    <p className="text-neutral-400 text-sm">{user.email}</p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
                    {/* Stats principales */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-neutral-900/50 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">⭐</div>
                            <div className="text-2xl font-bold text-orange-400">
                                {stats?.points || 0}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                                {t("profile.points", "Puntos")}
                            </div>
                        </div>
                        <div className="bg-neutral-900/50 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">🎮</div>
                            <div className="text-2xl font-bold text-white">
                                {stats?.gamesPlayed || 0}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                                {t("profile.gamesPlayed", "Partidas")}
                            </div>
                        </div>
                        <div className="bg-neutral-900/50 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="text-2xl font-bold text-white">
                                {(stats?.winsAsImpostor || 0) + (stats?.winsAsFriend || 0)}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                                {t("profile.wins", "Victorias")}
                            </div>
                        </div>
                    </div>

                    {/* Stats detalladas */}
                    <div className="bg-neutral-900/30 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {t("profile.detailedStats", "Estadísticas detalladas")}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white">
                                    {t("profile.asImpostor", "Como impostor")}
                                </span>
                                <span className="text-neutral-400">
                                    <span className="text-white">{stats?.gamesAsImpostor || 0}</span> {t("profile.games", "partidas")},{" "}
                                    <span className="text-white">{stats?.winsAsImpostor || 0}</span> {t("profile.winsShort", "victorias")}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white">
                                    {t("profile.asFriend", "Como amigo")}
                                </span>
                                <span className="text-neutral-400">
                                    <span className="text-white">{(stats?.gamesPlayed || 0) - (stats?.gamesAsImpostor || 0)}</span>{" "}
                                    {t("profile.games", "partidas")},{" "}
                                    <span className="text-white">{stats?.winsAsFriend || 0}</span> {t("profile.winsShort", "victorias")}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
