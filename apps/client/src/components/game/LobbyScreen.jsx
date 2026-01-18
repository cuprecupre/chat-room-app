import React, { useState, useEffect } from "react";
import { Link, Share, Check, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";
import { PlayerList } from "./PlayerList";

// Firebase Storage CDN URL
const dualImpostorImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fdual-impostor.jpg?alt=media";

export function LobbyScreen({
    state,
    isHost,
    user,
    onCopyLink,
    onStartGame,
    onUpdateOptions,
    isMobile,
    onVote,
    onOpenInstructions,
    onKickPlayer,
}) {
    const [showImpostorHint, setShowImpostorHint] = useState(
        state.options?.showImpostorHint !== undefined ? state.options.showImpostorHint : true
    );
    const [gameMode, setGameMode] = useState(
        state.options?.gameMode || 'voice'
    );

    // Sync state when room options change (e.g. from server)
    useEffect(() => {
        if (state.options?.showImpostorHint !== undefined) {
            setShowImpostorHint(state.options.showImpostorHint);
        }
        if (state.options?.gameMode) {
            setGameMode(state.options.gameMode);
        }
    }, [state.options?.showImpostorHint, state.options?.gameMode]);

    const handleToggleHint = () => {
        const newValue = !showImpostorHint;
        setShowImpostorHint(newValue);
        if (onUpdateOptions) {
            onUpdateOptions({ showImpostorHint: newValue });
        }
    };

    const handleToggleGameMode = () => {
        const newMode = gameMode === 'voice' ? 'chat' : 'voice';
        setGameMode(newMode);
        if (onUpdateOptions) {
            onUpdateOptions({ gameMode: newMode });
        }
    };

    const handleStartGame = () => {
        onStartGame({ showImpostorHint, gameMode });
    };
    const { t } = useTranslation('game');
    const { t: tc } = useTranslation('common');
    const host = state.players?.find((p) => p.uid === state.hostId);
    let hostName = host ? host.name.toUpperCase() : (t('lobby.host') || 'HOST');

    // Robustness: if I am the host, use my name directly
    if (isHost && user?.name) {
        hostName = user.name.toUpperCase();
    }

    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-32 pt-10 px-0">
            {/* Room Identifier Badge */}
            <div className="flex items-center justify-center mb-6 animate-fadeIn">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 rounded-full">
                    SALA DE {hostName}
                </span>
            </div>

            {isHost ? (
                /* HOST VIEW */
                <>
                    <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                        {t('lobby.inviteFriendsTitle', 'Invite your friends')}
                        <br />
                        {t('lobby.toStart', 'to start')}
                    </h2>

                    <div className="w-full space-y-4 mt-8">


                        <div className="w-full pt-2">
                            {/* Opciones de juego (solo para el host antes de empezar) */}

                            {/* Game Mode Selector (Square Toggles) */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGameMode('chat');
                                        if (onUpdateOptions) onUpdateOptions({ gameMode: 'chat' });
                                    }}
                                    className={`flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all text-left h-full ${gameMode === 'chat'
                                        ? "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                        }`}
                                >
                                    <div className="w-full">
                                        <span className={`block font-bold text-sm mb-1 ${gameMode === 'chat' ? "text-orange-400" : "text-neutral-200"}`}>
                                            Modo Chat
                                        </span>
                                        <p className="text-[10px] leading-relaxed text-neutral-400">
                                            Los jugadores dan sus pistas por medio de un chat interactivo.
                                        </p>
                                    </div>
                                    <div className={`mt-3 w-full flex justify-end ${gameMode === 'chat' ? "text-orange-500" : "text-white/10"}`}>
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setGameMode('voice');
                                        if (onUpdateOptions) onUpdateOptions({ gameMode: 'voice' });
                                    }}
                                    className={`flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all text-left h-full ${gameMode === 'voice'
                                        ? "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                        }`}
                                >
                                    <div className="w-full">
                                        <span className={`block font-bold text-sm mb-1 ${gameMode === 'voice' ? "text-orange-400" : "text-neutral-200"}`}>
                                            Modo voz
                                        </span>
                                        <p className="text-[10px] leading-relaxed text-neutral-400">
                                            Los jugadores dan sus pistas por voz. Ideal para jugar juntos o en llamada.
                                        </p>
                                    </div>
                                    <div className={`mt-3 w-full flex justify-end ${gameMode === 'voice' ? "text-orange-500" : "text-white/10"}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </div>
                                </button>
                            </div>

                            <div className="bg-white/5 rounded-md p-4 font-sans mb-6">
                                <label className="flex items-center justify-between cursor-pointer gap-4">
                                    <div className="flex-1 text-left">
                                        <span className="text-sm font-semibold text-neutral-300">
                                            {t('lobby.easyMode', 'Easy mode')}
                                        </span>
                                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                            {t('lobby.easyModeDesc', 'The Impostor will receive a hint about the secret word.')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleHint}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${showImpostorHint ? "bg-green-500" : "bg-neutral-700"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${showImpostorHint ? "translate-x-6" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </label>
                            </div>

                            <div className="flex flex-col items-center gap-4 mb-8">
                                <Button
                                    onClick={onCopyLink}
                                    variant="outline"
                                    size="md"
                                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2 !w-auto"
                                >
                                    {isMobile ? (
                                        <Share className="w-4 h-4" />
                                    ) : (
                                        <Link className="w-4 h-4" />
                                    )}
                                    {isMobile
                                        ? t('lobby.shareInvite', 'Share invite')
                                        : t('lobby.copyRoomLink', 'Copy room link')}
                                </Button>
                                <p className="text-sm text-neutral-400 font-regular animate-pulse max-w-[280px] mx-auto">
                                    {t('lobby.shareAndWait', 'Share the link and wait for players to join')}
                                </p>
                            </div>

                            <div className="text-sm font-semibold text-neutral-400 text-left px-1 mt-8 mb-3">
                                {t('lobby.playersConnected', 'Players connected')}: {state.players.length}
                            </div>
                            <PlayerList
                                players={state.players}
                                currentUserId={user.uid}
                                isHost={isHost}
                                onCopyLink={onCopyLink}
                                gameState={state}
                                onVote={onVote}
                                onOpenInstructions={onOpenInstructions}
                                onKickPlayer={onKickPlayer}
                            />
                        </div>
                    </div>

                    {/* Fixed Start Game Button (Host only) */}
                    <div className="fixed bottom-0 left-0 right-0 z-40">
                        <div className="w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pb-8 px-4">
                            <div className="max-w-md mx-auto">
                                <Button
                                    onClick={handleStartGame}
                                    disabled={state.players.length < 3}
                                    variant="primary"
                                    size="md"
                                    className="w-full shadow-2xl"
                                >
                                    {tc('buttons.startGame')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* GUEST VIEW */
                <>
                    <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                        {t('lobby.gameStartingSoon', 'Game starting soon')}
                    </h2>

                    <div className="space-y-6 mt-8">
                        <p className="text-sm text-neutral-400 text-center">
                            <svg
                                className="animate-spin inline-block h-3 w-3 text-orange-400 mr-2 align-middle"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {t('lobby.waitingFor', 'Waiting for')} <span className="text-orange-400 font-medium">
                                {state.players.find((p) => p.uid === state.hostId)?.name ||
                                    "host"}
                            </span> {t('lobby.toStartGame', 'to start the game')}
                        </p>

                        <div className="w-full">
                            {state.options?.showImpostorHint && (
                                <div className="mb-2 flex items-center justify-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />
                                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-500/80">
                                        {t('lobby.easyModeOn', 'Easy mode enabled')}
                                    </span>
                                </div>
                            )}
                            {state.options?.gameMode === 'chat' && (
                                <div className="mb-4 flex items-center justify-center gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-blue-400/80">
                                        {t('lobby.chatModeOn', 'Chat mode enabled')}
                                    </span>
                                </div>
                            )}
                            {state.options?.gameMode === 'voice' && (
                                <div className="mb-4 flex items-center justify-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-orange-400/80">
                                        {t('lobby.voiceModeOn', 'Voice mode enabled')}
                                    </span>
                                </div>
                            )}
                            <div className="text-sm font-semibold text-neutral-400 text-left px-1 mt-8 mb-3">
                                {t('lobby.playersConnected', 'Players connected')}: {state.players.length}
                            </div>
                            <PlayerList
                                players={state.players}
                                currentUserId={user.uid}
                                isHost={isHost}
                                onCopyLink={onCopyLink}
                                gameState={state}
                                onVote={onVote}
                                onOpenInstructions={onOpenInstructions}
                            />
                        </div>

                        <div className="pt-4 space-y-3">
                            <p className="text-sm text-neutral-500">
                                {t('lobby.alsoInvite', 'You can also invite friends')}
                            </p>
                            <Button
                                onClick={onCopyLink}
                                variant="outline"
                                size="md"
                                className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2 !w-auto"
                            >
                                {isMobile ? (
                                    <Share className="w-4 h-4" />
                                ) : (
                                    <Link className="w-4 h-4" />
                                )}
                                {isMobile
                                    ? t('lobby.shareInvite', 'Share invite')
                                    : t('lobby.copyRoomLink', 'Copy room link')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
