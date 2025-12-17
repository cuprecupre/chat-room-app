import toast from 'react-hot-toast';

// Error keywords to detect error messages
const ERROR_KEYWORDS = [
  'no puedes',
  'no existe',
  'no perteneces',
  'partida en curso',
  'error',
  'eliminado',
  'no está',
  'no se puede',
  'solo el host',
  'expiró',
  'perdida',
];

// Shared toast styles
const successStyle = {
  background: '#166534', // bg-green-800
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '9999px',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  textAlign: 'center',
};

const errorStyle = {
  background: 'rgba(127, 29, 29, 0.9)', // bg-red-900/90
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '9999px',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  textAlign: 'center',
};

/**
 * Show a toast message with automatic error detection
 * @param {string} message - The message to display
 */
export function showToast(message) {
  const isError = ERROR_KEYWORDS.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isError) {
    toast.error(message, {
      duration: 3000,
      style: errorStyle,
      icon: null,
    });
  } else {
    toast.success(message, {
      duration: 3000,
      style: successStyle,
      icon: null,
    });
  }
}
