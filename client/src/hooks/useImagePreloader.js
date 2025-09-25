import { useEffect, useState } from 'react';

// Hook para precargar imágenes
export function useImagePreloader(imageUrls) {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadImages = async () => {
      const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, url]));
            resolve(url);
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${url}`);
            resolve(url); // Resolve anyway to not block other images
          };
          img.src = url;
        });
      });

      try {
        await Promise.all(promises);
        setIsLoading(false);
      } catch (error) {
        console.warn('Some images failed to load:', error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, [imageUrls]);

  return { loadedImages, isLoading };
}

// Hook específico para precargar assets de la app
export function useAppAssetsPreloader() {
  const assetUrls = [
    '/src/assets/card.png',
    '/src/assets/card-back.png', 
    '/src/assets/dual-impostor.png',
    '/src/assets/bell.png',
    '/src/assets/llave.png'
  ];

  return useImagePreloader(assetUrls);
}
