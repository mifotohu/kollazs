import React, { useCallback } from 'react';
import type { UploadedImage } from '../types';
import { MAX_IMAGES, MAX_FILE_SIZE_MB } from '../constants';
import { loadImage } from '../services/imageUtils';
import { UploadIcon, TrashIcon, ResetIcon, DemoIcon } from './icons';

interface ImageManagerProps {
  images: UploadedImage[];
  setImages: (images: UploadedImage[]) => void;
  onResetOrder: () => void;
  onLoadDemo: () => void;
  activeImageIndex: number | null;
  setActiveImageIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const ImageManager: React.FC<ImageManagerProps> = ({ images, setImages, onResetOrder, onLoadDemo, activeImageIndex, setActiveImageIndex }) => {

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let newImages: UploadedImage[] = [...images];

    for (let i = 0; i < files.length && newImages.length < MAX_IMAGES; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`A(z) "${file.name}" fájl túl nagy (max. ${MAX_FILE_SIZE_MB} MB).`);
        continue;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert(`A(z) "${file.name}" fájl formátuma nem támogatott.`);
        continue;
      }
      try {
        const loadedImage = await loadImage(file, newImages.length);
        newImages.push(loadedImage);
      } catch (error) {
         alert(`Hiba történt a(z) "${file.name}" kép betöltésekor.`);
         console.error(error);
      }
    }
    setImages(newImages);
    event.target.value = ''; // Reset file input
  }, [images, setImages]);

  const removeImage = useCallback((id: string) => {
    setImages(images.filter(img => img.id !== id));
  }, [images, setImages]);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.dataTransfer.setData("imageIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      const dragIndex = parseInt(e.dataTransfer.getData("imageIndex"), 10);
      const newImages = [...images];
      const [draggedImage] = newImages.splice(dragIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      setImages(newImages);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-bold mb-3 text-gray-700">Képek (max. {MAX_IMAGES} db)</h2>
      <label
        htmlFor="file-upload"
        className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4"
      >
        <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
        <span className="font-semibold text-gray-600">Kattints a feltöltéshez</span>
        <span className="text-xs text-gray-500">JPG, PNG - max. {MAX_FILE_SIZE_MB}MB/fájl</span>
        <input id="file-upload" type="file" multiple accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
      </label>
      
      <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        {images.length > 0 ? (
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
                onClick={() => setActiveImageIndex(index === activeImageIndex ? null : index)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-all border ${
                  index === activeImageIndex ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <img src={image.previewUrl} alt={image.file.name} className="w-12 h-12 object-cover rounded-md mr-3 flex-shrink-0" />
                <div className="flex-grow text-xs overflow-hidden">
                  <p className="font-semibold truncate text-gray-700">{image.file.name}</p>
                  <p className="text-gray-500">{image.width}x{image.height}px</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeImage(image.id); }} className="p-1 text-gray-400 hover:text-red-600 rounded-full transition-colors ml-2">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm py-8">
            <p>Nincsenek képek feltöltve.</p>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col space-y-2">
        <button onClick={onLoadDemo} className="w-full flex items-center justify-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors text-xs">
          <DemoIcon className="w-4 h-4 mr-2" />
          Demó képek betöltése
        </button>
        <button onClick={onResetOrder} disabled={images.length < 2} className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs">
          <ResetIcon className="w-4 h-4 mr-2" />
          Sorrend visszaállítása
        </button>
      </div>
    </div>
  );
};

export default ImageManager;
