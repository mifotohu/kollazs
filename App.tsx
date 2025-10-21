
import React, { useState, useRef, useCallback } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import ImageManager from './components/ImageManager';
import CollageCanvas from './components/CollageCanvas';
import ControlsPanel from './components/ControlsPanel';
import type { UploadedImage, ImageTransform, CollageLayout, CollageState, AspectRatio, ExportFormat, OutputResolution } from './types';
import { 
    DEFAULT_LAYOUT, DEFAULT_BACKGROUND_COLOR, DEFAULT_SPACING, DEFAULT_CORNER_RADIUS, 
    DEFAULT_ASPECT_RATIO, DEFAULT_EXPORT_FORMAT, DEFAULT_JPG_QUALITY,
    DEFAULT_OUTPUT_RESOLUTION, DEFAULT_CUSTOM_WIDTH, DEFAULT_CUSTOM_HEIGHT, MAX_IMAGES 
} from './constants';
import { downloadFile, loadJsonFromFile } from './services/fileUtils';
import { base64ToFile, loadImage, getDemoImageUrls } from './services/imageUtils';

function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [initialImageOrder, setInitialImageOrder] = useState<UploadedImage[]>([]);
  const [imageTransforms, setImageTransforms] = useState<ImageTransform[]>([]);
  const [layout, setLayout] = useState<CollageLayout>(DEFAULT_LAYOUT);
  const [spacing, setSpacing] = useState(DEFAULT_SPACING);
  const [cornerRadius, setCornerRadius] = useState(DEFAULT_CORNER_RADIUS);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // New and restored state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(DEFAULT_EXPORT_FORMAT);
  const [jpgQuality, setJpgQuality] = useState(DEFAULT_JPG_QUALITY);
  const [outputResolution, setOutputResolution] = useState<OutputResolution>(DEFAULT_OUTPUT_RESOLUTION);
  const [customWidth, setCustomWidth] = useState(DEFAULT_CUSTOM_WIDTH);
  const [customHeight, setCustomHeight] = useState(DEFAULT_CUSTOM_HEIGHT);

  const canvasRef = useRef<HTMLDivElement>(null);
  
  const handleDownload = useCallback(async () => {
    if (canvasRef.current === null) {
      alert("A kollázs elem nem található.");
      return;
    }
    const node = canvasRef.current;
    
    // Calculate aspect ratio from the node itself if it's 'free'
    const nodeAspectRatio = node.clientWidth / node.clientHeight;
    let finalAspectRatio = nodeAspectRatio;
    if (aspectRatio !== 'free') {
      const [w, h] = aspectRatio.split(':').map(Number);
      finalAspectRatio = w / h;
    }

    if (isNaN(finalAspectRatio) || finalAspectRatio <= 0) {
      alert("A kollázs mérete érvénytelen a letöltéshez.");
      return;
    }

    let targetWidth = 0;
    let targetHeight = 0;
    const parsePx = (val: string) => parseInt(val.replace('px', ''));

    switch (outputResolution) {
      case '2000px':
      case '3000px':
      case '4096px':
        const shorterSide = parsePx(outputResolution);
        if (finalAspectRatio >= 1) { // Landscape or square
          targetHeight = shorterSide;
          targetWidth = shorterSide * finalAspectRatio;
        } else { // Portrait
          targetWidth = shorterSide;
          targetHeight = shorterSide / finalAspectRatio;
        }
        break;
      case 'a4':
        const a4Width = 2480;
        const a4Height = 3508;
        if (finalAspectRatio > (a4Width / a4Height)) {
          targetWidth = a4Width;
          targetHeight = a4Width / finalAspectRatio;
        } else {
          targetHeight = a4Height;
          targetWidth = a4Height * finalAspectRatio;
        }
        break;
      case 'custom':
        targetWidth = customWidth;
        targetHeight = customHeight;
        break;
    }

    targetWidth = Math.round(targetWidth);
    targetHeight = Math.round(targetHeight);

    if (targetWidth <= 0 || targetHeight <= 0 || !isFinite(targetWidth) || !isFinite(targetHeight)) {
        alert('Érvénytelen kimeneti méret. Kérjük, ellenőrizze a beállításokat.');
        return;
    }

    const exportOptions = {
        cacheBust: true,
        width: targetWidth,
        height: targetHeight,
    };

    try {
        let dataUrl;
        const filename = `collage.${exportFormat}`;
        switch (exportFormat) {
            case 'jpeg':
                dataUrl = await toJpeg(node, { ...exportOptions, quality: jpgQuality });
                break;
            case 'png':
            default:
                dataUrl = await toPng(node, exportOptions);
                break;
        }
        downloadFile(dataUrl, filename);
    } catch (err) {
        console.error('Oops, something went wrong!', err);
        alert('Hiba történt a kollázs letöltése közben.');
    }
  }, [canvasRef, outputResolution, customWidth, customHeight, exportFormat, jpgQuality, aspectRatio]);


  const handleSave = useCallback(() => {
    const state: CollageState = {
      images: images.map(img => ({
        name: img.file.name,
        type: img.file.type,
        base64: img.base64,
        width: img.width,
        height: img.height,
      })),
      imageTransforms,
      layout,
      backgroundColor,
      spacing,
      cornerRadius,
      aspectRatio,
      exportFormat,
      jpgQuality,
      outputResolution,
      customWidth,
      customHeight,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`;
    downloadFile(jsonString, 'collage-project.json');
  }, [images, imageTransforms, layout, backgroundColor, spacing, cornerRadius, aspectRatio, exportFormat, jpgQuality, outputResolution, customWidth, customHeight]);

  const handleLoad = useCallback(async (file: File) => {
    try {
      const state: CollageState = await loadJsonFromFile(file);
      if (!state.images || !state.imageTransforms || !state.layout) {
          throw new Error("Invalid project file format");
      }

      const loadedImages: UploadedImage[] = await Promise.all(
          state.images.map((imgData, index) => {
              const file = base64ToFile(imgData.base64, imgData.name, imgData.type);
              return loadImage(file, index);
          })
      );
      
      setImages(loadedImages);
      setInitialImageOrder(loadedImages);
      setImageTransforms(state.imageTransforms);
      setLayout(state.layout);
      setBackgroundColor(state.backgroundColor || DEFAULT_BACKGROUND_COLOR);
      setSpacing(state.spacing ?? DEFAULT_SPACING);
      setCornerRadius(state.cornerRadius ?? DEFAULT_CORNER_RADIUS);
      setAspectRatio(state.aspectRatio ?? DEFAULT_ASPECT_RATIO);
      setExportFormat(state.exportFormat ?? DEFAULT_EXPORT_FORMAT);
      setJpgQuality(state.jpgQuality ?? DEFAULT_JPG_QUALITY);
      setOutputResolution(state.outputResolution ?? DEFAULT_OUTPUT_RESOLUTION);
      setCustomWidth(state.customWidth ?? DEFAULT_CUSTOM_WIDTH);
      setCustomHeight(state.customHeight ?? DEFAULT_CUSTOM_HEIGHT);
      setActiveImageIndex(null);

    } catch (error) {
      console.error("Failed to load project file:", error);
      alert('Hiba a projektfájl betöltésekor.');
    }
  }, []);

  const handleImageTransformChange = (newTransform: ImageTransform) => {
      if (activeImageIndex === null) return;
      setImageTransforms(currentTransforms => {
          const newTransforms = [...currentTransforms];
          newTransforms[activeImageIndex] = newTransform;
          return newTransforms;
      });
  }
  
  const setImagesWithOrder = (newImages: UploadedImage[]) => {
      const newTransforms = newImages.map(() => ({ pan: { x: 0, y: 0 }, zoom: 1, rotation: 0 }));
      setImages(newImages);
      setInitialImageOrder(newImages);
      setImageTransforms(newTransforms);
  }

  const handleResetOrder = () => {
    setImages([...initialImageOrder]);
  };

  const handleLoadDemo = async () => {
    const allDemoImageUrls = getDemoImageUrls();
    const shuffled = allDemoImageUrls.sort(() => 0.5 - Math.random());
    const numToLoad = Math.floor(Math.random() * (MAX_IMAGES - 5 + 1)) + 5;
    const selectedUrls = shuffled.slice(0, numToLoad);

    try {
      const loadedImages = await Promise.all(
        selectedUrls.map(async (dataUrl, index) => {
          const file = base64ToFile(dataUrl, `demo-${index}.jpg`, 'image/jpeg');
          return loadImage(file, index);
        })
      );
      setImagesWithOrder(loadedImages);
    } catch (error) {
      console.error("Failed to load demo images:", error);
      alert('Hiba a demó képek betöltésekor.');
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-100 flex font-sans">
      <div className="w-80 bg-white p-4 flex flex-col shadow-lg overflow-y-auto custom-scrollbar">
        <ImageManager
          images={images}
          setImages={setImagesWithOrder}
          onResetOrder={handleResetOrder}
          onLoadDemo={handleLoadDemo}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
        />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-200 p-4 overflow-hidden">
        <CollageCanvas
          canvasRef={canvasRef}
          images={images}
          imageTransforms={imageTransforms}
          layout={layout}
          backgroundColor={backgroundColor}
          spacing={spacing}
          cornerRadius={cornerRadius}
          aspectRatio={aspectRatio}
          activeImageIndex={activeImageIndex}
          onImageClick={setActiveImageIndex}
          onImageTransformChange={handleImageTransformChange} // New prop
        />
      </main>
      <ControlsPanel
        layout={layout}
        setLayout={setLayout}
        spacing={spacing}
        setSpacing={setSpacing}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        outputResolution={outputResolution}
        setOutputResolution={setOutputResolution}
        customWidth={customWidth}
        setCustomWidth={setCustomWidth}
        customHeight={customHeight}
        setCustomHeight={setCustomHeight}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        jpgQuality={jpgQuality}
        setJpgQuality={setJpgQuality}
        onDownload={handleDownload}
        onSave={handleSave}
        onLoad={handleLoad}
        activeImageIndex={activeImageIndex}
        imageTransform={activeImageIndex !== null ? imageTransforms[activeImageIndex] : null}
        onImageTransformChange={handleImageTransformChange}
      />
    </div>
  );
}

export default App;
