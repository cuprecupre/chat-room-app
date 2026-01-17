import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Coffee } from "lucide-react";

export function Footer({ roomId }) {
    const { t } = useTranslation(['common']);
    return (
        <footer className="w-full py-6 px-6 relative z-10">
            <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-neutral-600 font-medium tracking-wider uppercase">
                    &copy; {new Date().getFullYear()} {t('login.appTitle', 'Impostor')}
                </p>
                {!roomId && (
                    <p className="text-[10px] text-neutral-700 max-w-xs text-center leading-relaxed">
                        {t('footer.tagline', 'Un juego de engaño y deducción social')}
                    </p>
                )}
            </div>
        </footer>
    );
}
