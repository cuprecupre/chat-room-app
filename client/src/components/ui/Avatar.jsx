import React from 'react';

export function Avatar({ 
  photoURL, 
  displayName, 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-2xl',
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Generar iniciales del nombre
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };
  
  // Generar color basado en el nombre
  const getColorFromName = (name) => {
    if (!name) return 'bg-neutral-600';
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = getInitials(displayName);
  const bgColor = getColorFromName(displayName);

  // Usuario de Google (tiene foto)
  if (photoURL) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden ${className}`} style={{ backgroundColor: '#e5e7eb' }}>
        <img
          src={photoURL}
          alt={displayName}
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
      </div>
    );
  }

  // Usuario de email (sin foto) - mostrar iniciales
  return (
    <div className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center text-white font-semibold ${className}`}>
      {initials}
    </div>
  );
}
