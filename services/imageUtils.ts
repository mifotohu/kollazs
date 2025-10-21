import type { UploadedImage } from '../types';

export function loadImage(file: File, index: number): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const base64 = await fileToBase64(file);
        resolve({
          id: `${file.name}-${Date.now()}`,
          file,
          previewUrl: img.src,
          width: img.width,
          height: img.height,
          originalIndex: index,
          base64,
        });
      };
      img.onerror = reject;
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Could not read file."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generatePlaceholderImage(width: number, height: number, text: string, bgColor: string, textColor: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.min(width, height) / 6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  return canvas.toDataURL('image/jpeg');
}

export function getDemoImageUrls(): string[] {
    const colors = [
        ['#f3a683', '#3d3d3d'], ['#f7d794', '#3d3d3d'], ['#77dd77', '#3d3d3d'],
        ['#f8c291', '#3d3d3d'], ['#e77f67', '#ffffff'], ['#786fa6', '#ffffff'],
        ['#cf6a87', '#ffffff'], ['#f5cd79', '#3d3d3d'], ['#54a0ff', '#ffffff'],
        ['#576574', '#ffffff'], ['#e66767', '#ffffff'], ['#303952', '#ffffff'],
        ['#3dc1d3', '#3d3d3d'], ['#c44569', '#ffffff'], ['#227093', '#ffffff']
    ];
    return colors.map((colorPair, i) => 
        generatePlaceholderImage(800, 600, `Demó ${i + 1}`, colorPair[0], colorPair[1])
    );
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function base64ToFile(base64: string, filename: string, type: string): File {
    const arr = base64.split(',');
    if (arr.length < 2) {
      throw new Error('Invalid base64 string');
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : type;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
}