import type { UploadedImage } from '../types';
import type { CollageLayout } from '../types';

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // For polaroid
}

// Simple deterministic PRNG for reproducible layouts
class SimplePRNG {
    private seed: number;
    constructor(seed: number = Date.now()) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}


export function calculateLayout(
  images: UploadedImage[],
  layout: CollageLayout,
  canvasWidth: number,
  canvasHeight: number,
  spacing: number
): ImagePosition[] {
  if (images.length === 0) return [];
  const prng = new SimplePRNG(images.length * 1337);

  switch (layout) {
    case 'grid':
      return calculateGridLayout(images, canvasWidth, canvasHeight, spacing);
    case 'masonry':
      return calculateMasonryLayout(images, canvasWidth, spacing);
    case 'rows':
        return calculateRowsLayout(images, canvasWidth, canvasHeight, spacing);
    case 'columns':
        return calculateColumnsLayout(images, canvasWidth, canvasHeight, spacing);
    case 'random':
        return calculateRandomLayout(images, canvasWidth, canvasHeight, prng);
    case 'polaroid':
        return calculatePolaroidLayout(images, canvasWidth, canvasHeight, prng);
    case 'filmstrip':
        return calculateFilmstripLayout(images, canvasWidth, canvasHeight, spacing, prng);
    case 'geometric':
        return calculateGeometricLayout(images, canvasWidth, canvasHeight, spacing);
    case 'heart':
        return calculateHeartLayout(images, canvasWidth, canvasHeight, prng);
    case 'circlepack':
        return calculateCirclePackLayout(images, canvasWidth, canvasHeight, spacing, prng);
    case 'honeycomb':
        return calculateHoneycombLayout(images, canvasWidth, canvasHeight, spacing);
    case 'spiral':
        return calculateSpiralLayout(images, canvasWidth, canvasHeight, spacing);
    default:
      return calculateGridLayout(images, canvasWidth, canvasHeight, spacing);
  }
}

function calculateGridLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    const count = images.length;
    if (count === 0) return [];

    const cols = Math.ceil(Math.sqrt(count * (canvasWidth / canvasHeight)));
    const rows = Math.ceil(count / cols);

    const availableWidth = canvasWidth - (cols - 1) * spacing;
    const availableHeight = canvasHeight - (rows - 1) * spacing;

    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    return images.map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return {
            x: col * (cellWidth + spacing),
            y: row * (cellHeight + spacing),
            width: cellWidth,
            height: cellHeight,
        };
    });
}

function calculateMasonryLayout(images: UploadedImage[], canvasWidth: number, spacing: number): ImagePosition[] {
    const numCols = Math.max(2, Math.min(4, Math.floor(canvasWidth / 250)));
    const colWidth = (canvasWidth - (numCols - 1) * spacing) / numCols;
    const colHeights = Array(numCols).fill(0);
    
    return images.map(image => {
        const minHeight = Math.min(...colHeights);
        const colIndex = colHeights.indexOf(minHeight);
        
        const imgHeight = (image.height / image.width) * colWidth;
        
        const position: ImagePosition = {
            x: colIndex * (colWidth + spacing),
            y: minHeight,
            width: colWidth,
            height: imgHeight,
        };
        
        colHeights[colIndex] += imgHeight + spacing;
        
        return position;
    });
}

function calculateRowsLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    if (images.length === 0) return [];
    const rowHeight = (canvasHeight - (images.length - 1) * spacing) / images.length;
    let currentY = 0;
    
    return images.map(image => {
        const imgWidth = rowHeight * (image.width / image.height);
        const position: ImagePosition = {
            x: (canvasWidth - imgWidth) / 2, // Center the image
            y: currentY,
            width: imgWidth,
            height: rowHeight,
        };
        currentY += rowHeight + spacing;
        return position;
    });
}

function calculateColumnsLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    if (images.length === 0) return [];
    const colWidth = (canvasWidth - (images.length - 1) * spacing) / images.length;
    let currentX = 0;

    return images.map(image => {
        const imgHeight = colWidth * (image.height / image.width);
        const position: ImagePosition = {
            x: currentX,
            y: (canvasHeight - imgHeight) / 2, // Center the image
            width: colWidth,
            height: imgHeight,
        };
        currentX += colWidth + spacing;
        return position;
    });
}

function calculateRandomLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, prng: SimplePRNG): ImagePosition[] {
    return images.map(() => {
        const width = prng.next() * (canvasWidth / 3) + (canvasWidth / 5);
        const height = prng.next() * (canvasHeight / 3) + (canvasHeight / 5);
        const x = prng.next() * (canvasWidth - width);
        const y = prng.next() * (canvasHeight - height);
        return { x, y, width, height };
    });
}

function calculatePolaroidLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, prng: SimplePRNG): ImagePosition[] {
    return images.map(() => {
        const size = Math.min(canvasWidth, canvasHeight) * (prng.next() * 0.2 + 0.25);
        const x = prng.next() * (canvasWidth - size);
        const y = prng.next() * (canvasHeight - size);
        const rotation = prng.next() * 30 - 15; // -15 to +15 degrees
        return { x, y, width: size, height: size, rotation };
    });
}

function calculateFilmstripLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number, prng: SimplePRNG): ImagePosition[] {
    const angle = (prng.next() * 40 - 20) * (Math.PI / 180); // -20 to 20 degrees
    const stripLength = Math.sqrt(canvasWidth**2 + canvasHeight**2);
    const itemSize = stripLength / (images.length * 0.8);
    const overlap = itemSize * 0.3;

    const startX = canvasWidth / 2 - (stripLength / 2) * Math.cos(angle);
    const startY = canvasHeight / 2 - (stripLength / 2) * Math.sin(angle);

    return images.map((_, i) => {
        const distance = i * (itemSize - overlap);
        return {
            x: startX + distance * Math.cos(angle) - itemSize / 2,
            y: startY + distance * Math.sin(angle) - itemSize / 2,
            width: itemSize,
            height: itemSize,
            rotation: angle * (180 / Math.PI),
        };
    });
}

function calculateGeometricLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    const n = images.length;
    if (n === 0) return [];
    const W = canvasWidth, H = canvasHeight, S = spacing;

    if (n === 1) return [{ x: 0, y: 0, width: W, height: H }];
    if (n === 2) return [{ x: 0, y: 0, width: W/2 - S/2, height: H }, { x: W/2 + S/2, y: 0, width: W/2 - S/2, height: H }];
    if (n === 3) return [{ x: 0, y: 0, width: W/2 - S/2, height: H }, { x: W/2 + S/2, y: 0, width: W/2 - S/2, height: H/2 - S/2 }, { x: W/2 + S/2, y: H/2 + S/2, width: W/2 - S/2, height: H/2 - S/2 }];
    if (n === 4) return calculateGridLayout(images, W, H, S);
    // 5+ images: hero image and a grid
    const hero = { x: 0, y: 0, width: W * 0.6 - S/2, height: H };
    const gridImages = images.slice(1);
    const gridCols = Math.ceil(Math.sqrt(gridImages.length));
    const gridRows = Math.ceil(gridImages.length / gridCols);
    const gridX = W * 0.6 + S/2;
    const gridW = W * 0.4 - S/2;
    const gridH = H;
    const cellW = (gridW - (gridCols - 1) * S) / gridCols;
    const cellH = (gridH - (gridRows - 1) * S) / gridRows;

    const others = gridImages.map((_, i) => {
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        return { x: gridX + col * (cellW + S), y: row * (cellH + S), width: cellW, height: cellH };
    });
    return [hero, ...others];
}

function calculateHeartLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, prng: SimplePRNG): ImagePosition[] {
    const positions: ImagePosition[] = [];
    const size = Math.min(canvasWidth, canvasHeight);
    
    for (let i = 0; i < images.length; i++) {
        let x, y, valid = false;
        let attempts = 0;
        const imgSize = size * (prng.next() * 0.15 + 0.1); // Random size

        while (!valid && attempts < 100) {
            // Pick a random point in the bounding box
            const px = (prng.next() - 0.5) * size * 1.2 + canvasWidth / 2;
            const py = (prng.next() - 0.5) * size * 1.2 + canvasHeight / 2;
            
            // Check if it's inside a heart shape
            const hx = (px - canvasWidth / 2) / (size * 0.45);
            const hy = (py - canvasHeight / 2) / (size * 0.45);
            const eq = (hx**2 + hy**2 - 1)**3 - hx**2 * hy**3;
            
            if (eq < 0) {
                valid = true;
                positions.push({ x: px - imgSize/2, y: py - imgSize/2, width: imgSize, height: imgSize });
            }
            attempts++;
        }
    }
    return positions;
}


function calculateCirclePackLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number, prng: SimplePRNG): ImagePosition[] {
    // This is a very simplified circle packing
    let circles: { x: number; y: number; r: number }[] = [];
    const maxR = Math.min(canvasWidth, canvasHeight) / 3;
    const minR = Math.min(canvasWidth, canvasHeight) / 15;

    for (let i = 0; i < images.length; i++) {
        let newCircle: { x: number; y: number; r: number } | null = null;
        let attempts = 0;
        while(attempts < 500) {
            const r = prng.next() * (maxR - minR) + minR;
            const x = prng.next() * (canvasWidth - 2 * r) + r;
            const y = prng.next() * (canvasHeight - 2 * r) + r;

            let overlaps = false;
            for(const c of circles) {
                const dist = Math.sqrt((x - c.x)**2 + (y - c.y)**2);
                if (dist < c.r + r + spacing) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps) {
                newCircle = {x, y, r};
                break;
            }
            attempts++;
        }
        if (newCircle) {
            circles.push(newCircle);
        }
    }
    
    return circles.map(c => ({
        x: c.x - c.r,
        y: c.y - c.r,
        width: c.r * 2,
        height: c.r * 2
    }));
}


function calculateHoneycombLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    const positions: ImagePosition[] = [];
    if (images.length === 0) return positions;

    const numHexes = images.length;
    const areaPerHex = (canvasWidth * canvasHeight) / numHexes;
    const hexHeight = Math.sqrt((areaPerHex * 4) / (3 * Math.sqrt(3)));
    const hexWidth = (Math.sqrt(3) / 2) * hexHeight;

    let q = 0, r = 0; // Axial coordinates
    let i = 0;
    
    const directions = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, -1]];
    
    positions.push(getHexPosition(0, 0, hexWidth, hexHeight, spacing, canvasWidth, canvasHeight));
    i++;
    
    let k = 1; // Ring number
    while(i < numHexes) {
        q = k; r = 0; // Start of ring
        for(let side = 0; side < 6; side++) {
            for(let step = 0; step < k; step++) {
                if (i >= numHexes) break;
                positions.push(getHexPosition(q, r, hexWidth, hexHeight, spacing, canvasWidth, canvasHeight));
                i++;
                // Move to next hex on this side of the ring
                q += directions[(side + 2) % 6][0];
                r += directions[(side + 2) % 6][1];
            }
            if (i >= numHexes) break;
        }
        k++;
    }

    return positions;
}

function getHexPosition(q: number, r: number, hexWidth: number, hexHeight: number, spacing: number, canvasWidth: number, canvasHeight: number): ImagePosition {
    const x = (hexWidth + spacing) * (q + r/2);
    const y = (hexHeight * 0.75 + spacing) * r;
    
    return {
        x: x + canvasWidth / 2 - hexWidth / 2,
        y: y + canvasHeight / 2 - hexHeight*0.75 / 2,
        width: hexWidth,
        height: hexHeight * 0.866, 
    };
}


function calculateSpiralLayout(images: UploadedImage[], canvasWidth: number, canvasHeight: number, spacing: number): ImagePosition[] {
    const positions: ImagePosition[] = [];
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const numImages = images.length;
    
    const a = 10; 
    const b = Math.min(canvasWidth, canvasHeight) / (2 * Math.PI * Math.log(numImages + 2)); 

    for (let i = 0; i < numImages; i++) {
        const angle = 2.8 * Math.log(i + 2);
        const radius = a + b * angle;
        
        const size = Math.max(40, (Math.min(canvasWidth, canvasHeight) / Math.sqrt(i + 1)) * 0.3);
        
        const x = centerX + radius * Math.cos(angle) - size / 2;
        const y = centerY + radius * Math.sin(angle) - size / 2;

        positions.push({ x, y, width: size, height: size });
    }

    return positions;
}
