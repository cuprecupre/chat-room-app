import React from "react";

export function Avatar({ photoURL, displayName, size = "md", className = "" }) {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-20 h-20 text-xl",
        xl: "w-28 h-28 text-2xl",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    // Generar iniciales del nombre
    const getInitials = (name) => {
        if (!name) return "?";
        const words = name
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
        if (words.length === 0) return "?";
        if (words.length === 1) {
            return words[0][0].toUpperCase();
        }
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    // Generar color basado en el nombre
    const getColorFromName = (name) => {
        if (!name) return "bg-neutral-600";
        const colors = [
            "bg-red-500",
            "bg-orange-500",
            "bg-amber-500",
            "bg-yellow-500",
            "bg-lime-500",
            "bg-green-500",
            "bg-emerald-500",
            "bg-teal-500",
            "bg-cyan-500",
            "bg-sky-500",
            "bg-blue-500",
            "bg-indigo-500",
            "bg-violet-500",
            "bg-purple-500",
            "bg-fuchsia-500",
            "bg-pink-500",
            "bg-rose-500",
        ];
        const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
        setImgError(false);
    }, [photoURL]);

    const initials = getInitials(displayName);
    const bgColor = getColorFromName(displayName);

    // Si tiene foto de Google Y no ha fallado → mostrar imagen
    if (photoURL && !imgError) {
        return (
            <div className={`relative ${sizeClass} rounded-full overflow-hidden bg-neutral-800 ${className}`}>
                <img
                    src={photoURL}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    style={{ display: "block" }}
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Si NO tiene foto o falló, usar BotTTS-Neutral por defecto basado en el nombre
    const fallbackURL = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(displayName || 'impostor')}`;

    return (
        <div className={`${sizeClass} rounded-full overflow-hidden ${className}`}>
            <img
                src={fallbackURL}
                alt={displayName}
                className="w-full h-full object-cover bg-neutral-800"
            />
        </div>
    );
}
