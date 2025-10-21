
import React, { useRef } from 'react';
import type { CollageLayout, ImageTransform, AspectRatio, ExportFormat, OutputResolution } from '../types';
import { 
    LAYOUT_OPTIONS, RESOLUTION_OPTIONS, ASPECT_RATIO_OPTIONS, EXPORT_FORMAT_OPTIONS,
    DEFAULT_LAYOUT, DEFAULT_BACKGROUND_COLOR, DEFAULT_SPACING, DEFAULT_CORNER_RADIUS, 
    DEFAULT_ASPECT_RATIO, DEFAULT_EXPORT_FORMAT, DEFAULT_JPG_QUALITY, DEFAULT_OUTPUT_RESOLUTION 
} from '../constants';
import { SaveIcon, LoadIcon } from './icons';

interface ControlsPanelProps {
  layout: CollageLayout;
  setLayout: (layout: CollageLayout) => void;
  spacing: number;
  setSpacing: (spacing: number) => void;
  cornerRadius: number;
  setCornerRadius: (radius: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  outputResolution: OutputResolution;
  setOutputResolution: (res: OutputResolution) => void;
  customWidth: number;
  setCustomWidth: (width: number) => void;
  customHeight: number;
  setCustomHeight: (height: number) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  jpgQuality: number;
  setJpgQuality: (quality: number) => void;
  onDownload: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  activeImageIndex: number | null;
  imageTransform: ImageTransform | null;
  onImageTransformChange: (transform: ImageTransform) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  layout, setLayout, spacing, setSpacing, cornerRadius, setCornerRadius, backgroundColor, setBackgroundColor,
  aspectRatio, setAspectRatio, outputResolution, setOutputResolution, customWidth, setCustomWidth, customHeight, setCustomHeight,
  exportFormat, setExportFormat, jpgQuality, setJpgQuality,
  onDownload, onSave, onLoad, activeImageIndex, imageTransform, onImageTransformChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoad(file);
    }
    event.target.value = '';
  };
  
  const resetAll = () => {
      setLayout(DEFAULT_LAYOUT);
      setSpacing(DEFAULT_SPACING);
      setCornerRadius(DEFAULT_CORNER_RADIUS);
      setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
      setAspectRatio(DEFAULT_ASPECT_RATIO);
      setExportFormat(DEFAULT_EXPORT_FORMAT);
      setJpgQuality(DEFAULT_JPG_QUALITY);
      setOutputResolution(DEFAULT_OUTPUT_RESOLUTION);
  }

  return (
    <div className="w-80 bg-white p-4 flex flex-col shadow-lg overflow-y-auto custom-scrollbar">
      <h2 className="text-lg font-bold mb-4 text-gray-700">Vezérlőpult</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-700 mb-1">Képarány</label>
          <select id="aspect-ratio-select" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            {ASPECT_RATIO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="layout-select" className="block text-sm font-medium text-gray-700 mb-1">Elrendezés</label>
          <select id="layout-select" value={layout} onChange={e => setLayout(e.target.value as CollageLayout)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            {LAYOUT_OPTIONS.map(group => (
                <optgroup key={group.label} label={group.label}>
                    {group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="output-resolution-select" className="block text-sm font-medium text-gray-700 mb-1">Kimeneti felbontás</label>
          <select id="output-resolution-select" value={outputResolution} onChange={e => setOutputResolution(e.target.value as OutputResolution)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            {RESOLUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {outputResolution === 'custom' && (
            <div className="flex items-center space-x-2">
                <input type="number" placeholder="Szélesség" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                <span>x</span>
                <input type="number" placeholder="Magasság" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
            </div>
        )}

        <div>
          <label htmlFor="spacing-slider" className="block text-sm font-medium text-gray-700 mb-1">Térköz: {spacing}px</label>
          <input id="spacing-slider" type="range" min="0" max="50" value={spacing} onChange={e => setSpacing(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>

        <div>
          <label htmlFor="corner-slider" className="block text-sm font-medium text-gray-700 mb-1">Lekerekítés: {cornerRadius}px</label>
          <input id="corner-slider" type="range" min="0" max="100" value={cornerRadius} onChange={e => setCornerRadius(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>

        <div>
          <label htmlFor="bg-color" className="block text-sm font-medium text-gray-700 mb-1">Háttérszín</label>
          <div className="flex items-center space-x-2">
            <input id="bg-color" type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="p-1 h-10 w-10 block bg-white border border-gray-300 cursor-pointer rounded-lg" />
            <input type="text" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
          </div>
        </div>

        <button onClick={resetAll} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200">
            Beállítások visszaállítása
        </button>
      </div>

      {activeImageIndex !== null && imageTransform && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <h3 className="text-md font-bold text-gray-700">Kép szerkesztése</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nagyítás: {imageTransform.zoom.toFixed(2)}x</label>
                <input type="range" min="0.1" max="5" step="0.05" value={imageTransform.zoom} onChange={e => onImageTransformChange({...imageTransform, zoom: Number(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forgatás: {imageTransform.rotation}°</label>
                <input type="range" min="-180" max="180" value={imageTransform.rotation} onChange={e => onImageTransformChange({...imageTransform, rotation: Number(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-200 space-y-4">
        <div>
            <label htmlFor="export-format-select" className="block text-sm font-medium text-gray-700 mb-1">Exportálás formátuma</label>
            <select id="export-format-select" value={exportFormat} onChange={e => setExportFormat(e.target.value as ExportFormat)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                {EXPORT_FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        {exportFormat === 'jpeg' && (
             <div>
                <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-700 mb-1">Minőség: {Math.round(jpgQuality * 100)}%</label>
                <input id="quality-slider" type="range" min="0.1" max="1" step="0.05" value={jpgQuality} onChange={e => setJpgQuality(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
        )}

        <div className="space-y-2">
            <button onClick={onDownload} className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm">
                Kollázs letöltése ({exportFormat.toUpperCase()})
            </button>
            <button onClick={onSave} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
              <SaveIcon className="w-5 h-5 mr-2"/>
              Projekt mentése
            </button>
            <button onClick={handleLoadClick} className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm">
              <LoadIcon className="w-5 h-5 mr-2" />
              Projekt betöltése
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileLoad} />
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;
