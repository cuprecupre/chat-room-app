import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Edit2, Check, X, Camera, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../routes/routes";

// DiceBear avatar seeds
const AVATAR_SEEDS = [
    "Felix", "Anita", "Jasper", "Luna", "Oliver",
    "Coco", "Milo", "Ginger", "Pepper", "Shadow",
    "Buster", "Daisy", "Lucky", "Simba", "Nala"
];

export function ProfilePage({ gameState }) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { user, logout, updateUserInfo } = useAuth();
    const { stats, loading } = usePlayerStats(user?.uid);
    const isInMatch = gameState?.phase === "playing" || gameState?.phase === "round_result";

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhoto, setEditPhoto] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.displayName || "");
            setEditPhoto(user.photoURL || "");
        }
    }, [user, isEditing]);

    const handleRegisterClick = () => {
        navigate(ROUTES.GUEST_AUTH);
    };

    const handleSave = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        const success = await updateUserInfo(editName, editPhoto);
        if (success) {
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleRandomAvatar = () => {
        const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
        const url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed + Math.random()}`;
        setEditPhoto(url);
    };

    useEffect(() => {
        return () => {
            if (editPhoto && editPhoto.startsWith('blob:')) {
                URL.revokeObjectURL(editPhoto);
            }
        };
    }, [editPhoto]);


    return (
        <div className="min-h-[60vh] max-w-2xl mx-auto px-4">
            {/* Header con botón volver */}
            <div className="mt-4 mb-6 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("profile.back", "Volver")}</span>
                </button>

                <button
                    onClick={logout}
                    className="text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                    {t("nav.logout", "Cerrar sesión")}
                </button>
            </div>

            {/* Banner para Invitados - Simplificado */}
            {user?.isAnonymous && (
                <div className="bg-neutral-900 border border-orange-500/20 rounded-2xl p-6 mb-8 mt-2 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-5">
                        <div className="hidden md:flex bg-orange-600/10 p-4 rounded-full shrink-0">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <h3 className="text-lg md:text-xl font-serif text-white mb-1">
                                {t("profile.saveProgressTitle", "¿Quieres guardar tu progreso?")}
                            </h3>
                            <p className="text-neutral-400 text-sm font-light leading-relaxed">
                                {t("profile.saveProgressDesc", "Tu cuenta actual es temporal. Regístrate ahora para no perder tus puntos y estadísticas.")}
                            </p>
                        </div>
                        <Button
                            onClick={handleRegisterClick}
                            variant="primary"
                            size="md"
                            className="w-full md:w-auto px-6 md:px-8 rounded-full shadow-lg shrink-0"
                        >
                            {t("profile.registerNow", "Registrar cuenta")}
                        </Button>
                    </div>
                </div>
            )}

            {/* Perfil del usuario - Simplificado y unificado */}
            <div className="flex flex-col items-center mb-10 bg-neutral-900/50 p-8 rounded-2xl shadow-xl overflow-hidden">
                {!isEditing ? (
                    <>
                        <div className="relative mb-6">
                            <Avatar
                                photoURL={user?.photoURL}
                                displayName={user?.displayName}
                                size="xl"
                                className="shadow-2xl bg-neutral-800"
                            />
                            {!isInMatch ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute bottom-0 right-0 bg-neutral-800 p-2.5 rounded-full text-white shadow-lg border border-white/10 hover:bg-neutral-700 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            ) : (
                                <div
                                    className="absolute bottom-0 right-0 bg-neutral-900/80 p-2.5 rounded-full text-neutral-500 shadow-lg border border-white/5 cursor-not-allowed"
                                    title={t('profile.cannotEditInMatch', 'No puedes editar tu perfil durante una partida')}
                                >
                                    <Camera className="w-4 h-4 opacity-50" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
                                {user?.displayName || t("profile.anonymous", "Jugador")}
                            </h1>
                            {!isInMatch && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {isInMatch && (
                            <p className="text-xs text-orange-500/80 font-medium mb-4 animate-pulse">
                                ⚠️ {t('profile.cannotEditWarning', 'No puedes cambiar tu nombre mientras juegas')}
                            </p>
                        )}
                        {user?.email && (
                            <p className="text-neutral-400 font-light text-sm mb-2">{user.email}</p>
                        )}
                    </>
                ) : (
                    <div className="w-full space-y-6 animate-fadeIn">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <Avatar
                                    photoURL={editPhoto}
                                    displayName={editName}
                                    size="xl"
                                    className="shadow-2xl bg-neutral-800"
                                />
                                <div className="absolute -bottom-2 -right-2 flex gap-1 z-20">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRandomAvatar();
                                        }}
                                        className="bg-neutral-800 p-2 rounded-full text-white shadow-lg border border-white/10 hover:bg-neutral-700 transition-colors pointer-events-auto"
                                        title={t('auth.randomAvatar')}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full max-w-xs space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-bold ml-1">
                                    {t("profile.editName", "Tu nombre")}
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all font-light"
                                    placeholder={t("auth.namePlaceholder", "Tu nombre...")}
                                    maxLength={20}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                            <Button
                                onClick={() => setIsEditing(false)}
                                variant="outline"
                                className="px-8 rounded-full"
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t("buttons.cancel", "Cancelar")}
                            </Button>
                            <Button
                                onClick={handleSave}
                                variant="primary"
                                className="px-8 rounded-full"
                                disabled={isSaving || !editName.trim()}
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-2" />
                                )}
                                {t("buttons.save", "Guardar")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label={t("stats.gamesPlayed", "Partidas")}
                    value={stats?.gamesPlayed || 0}
                />
                <StatCard
                    label={t("stats.wins", "Victorias")}
                    value={(stats?.winsAsFriend || 0) + (stats?.winsAsImpostor || 0)}
                />
                <StatCard
                    label={t("stats.points", "Puntos")}
                    value={stats?.points || 0}
                />
                <StatCard
                    label={t("stats.impostor", "Impostor")}
                    value={stats?.gamesAsImpostor || 0}
                />
            </div>
        </div >
    );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-neutral-900/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-3xl font-serif font-bold text-white mb-1">
                {value}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                {label}
            </span>
        </div>
    );
}
