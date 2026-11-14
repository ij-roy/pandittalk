import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import {
  compositeImagesAsync,
  generateImageAsync,
  generateImageBackgroundAsync,
} from '@expo/image-utils';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(projectRoot, 'assets', 'icon.png');
const tempPath = path.join(projectRoot, 'assets', '.splash-icon-source.png');
const outPath = path.join(projectRoot, 'assets', 'splash-icon.png');
const canvasSize = 1024;
const logoSize = Math.round(canvasSize * 0.82);

function replaceBlackWithWhite(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);
  const png = PNG.sync.read(data);
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (r < 40 && g < 40 && b < 40) {
      png.data[i] = 255;
      png.data[i + 1] = 255;
      png.data[i + 2] = 255;
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(outputPath, PNG.sync.write(png));
}

replaceBlackWithWhite(sourcePath, tempPath);

const background = await generateImageBackgroundAsync({
  width: canvasSize,
  height: canvasSize,
  backgroundColor: '#ffffff',
  resizeMode: 'cover',
});

const { source: foreground } = await generateImageAsync(
  { projectRoot, cacheType: 'splash-icon-source' },
  {
    src: tempPath,
    resizeMode: 'contain',
    width: logoSize,
    height: logoSize,
  },
);

const composed = await compositeImagesAsync({
  background,
  foreground,
  x: Math.round((canvasSize - logoSize) / 2),
  y: Math.round((canvasSize - logoSize) / 2),
});

await fs.promises.writeFile(outPath, composed);
await fs.promises.unlink(tempPath);
console.log(`Wrote ${outPath} (${logoSize}px logo on ${canvasSize}px white canvas)`);
