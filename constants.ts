
import { CollageLayout, AspectRatio, ExportFormat, OutputResolution } from './types';

export const MAX_IMAGES = 10;
export const MAX_FILE_SIZE_MB = 5;

export const DEFAULT_LAYOUT: CollageLayout = 'grid';
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';
export const DEFAULT_SPACING = 10;
export const DEFAULT_CORNER_RADIUS = 0;
export const DEFAULT_ASPECT_RATIO: AspectRatio = 'free';
export const DEFAULT_EXPORT_FORMAT: ExportFormat = 'png';
export const DEFAULT_JPG_QUALITY = 0.95;
export const DEFAULT_OUTPUT_RESOLUTION: OutputResolution = '4096px';
export const DEFAULT_CUSTOM_WIDTH = 4096;
export const DEFAULT_CUSTOM_HEIGHT = 4096;

export const LAYOUT_OPTIONS: { label: string; options: { value: CollageLayout; label: string }[] }[] = [
    {
        label: 'Alapvető rácsok',
        options: [
            { value: 'grid', label: 'Rács' },
            { value: 'masonry', label: 'Falazat' },
            { value: 'rows', label: 'Sorok' },
            { value: 'columns', label: 'Oszlopok' },
        ],
    },
    {
        label: 'Kreatív elrendezések',
        options: [
            { value: 'polaroid', label: 'Polaroid halom' },
            { value: 'filmstrip', label: 'Átlós filmszalag' },
            { value: 'geometric', label: 'Geometrikus blokkok' },
            { value: 'heart', label: 'Szív alak' },
            { value: 'circlepack', label: 'Kör illesztés' },
            { value: 'honeycomb', label: 'Méhsejt' },
            { value: 'spiral', label: 'Spirál' },
            { value: 'random', label: 'Véletlen káosz' },
        ]
    }
];

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio, label: string }[] = [
    { value: 'free', label: 'Szabad' },
    { value: '1:1', label: '1:1 (Négyzet)' },
    { value: '4:3', label: '4:3 (Fekvő)' },
    { value: '16:9', label: '16:9 (Szélesvásznú)' },
    { value: '3:4', label: '3:4 (Álló)' },
    { value: '9:16', label: '9:16 (Álló)' },
];

export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat, label: string }[] = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPG' },
];

export const RESOLUTION_OPTIONS: { value: OutputResolution, label: string }[] = [
    { value: '2000px', label: '2000 px (rövidebb oldal)' },
    { value: '3000px', label: '3000 px (rövidebb oldal)' },
    { value: '4096px', label: '4096 px (rövidebb oldal)' },
    { value: 'a4', label: 'A4 300 DPI' },
    { value: 'custom', label: 'Egyedi méret' },
];
