import fs from 'fs';
import { tmpdir } from 'os';
import Crypto from 'crypto';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ff from 'fluent-ffmpeg';
import webp from 'node-webpmux';
import path from 'path';

const makeid = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

async function imageToWebp(buffer) {
  const tempOutput = path.join(tmpdir(), makeid(10) + '.webp');
  const tempInput = path.join(tmpdir(), makeid(10) + '.jpg');

  fs.writeFileSync(tempInput, buffer);

  await new Promise((resolve, reject) => {
    ff(tempInput)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
      ])
      .toFormat('webp')
      .save(tempOutput);
  });

  const result = fs.readFileSync(tempOutput);
  fs.unlinkSync(tempOutput);
  fs.unlinkSync(tempInput);
  return result;
}

async function videoToWebp(buffer) {
  const tempOutput = path.join(tmpdir(), makeid(10) + '.webp');
  const tempInput = path.join(tmpdir(), makeid(10) + '.mp4');

  fs.writeFileSync(tempInput, buffer);

  await new Promise((resolve, reject) => {
    ff(tempInput)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        '-loop', '0',
        '-ss', '00:00:00',
        '-t', '00:00:05',
        '-preset', 'default',
        '-an',
        '-vsync', '0'
      ])
      .toFormat('webp')
      .save(tempOutput);
  });

  const result = fs.readFileSync(tempOutput);
  fs.unlinkSync(tempOutput);
  fs.unlinkSync(tempInput);
  return result;
}

async function writeExifImg(buffer, metadata) {
  let webpBuffer = await imageToWebp(buffer);
  const tempInput = path.join(tmpdir(), makeid(10) + '.webp');
  const tempOutput = path.join(tmpdir(), makeid(10) + '.webp');

  fs.writeFileSync(tempInput, webpBuffer);

  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': 'https://instagram.com/surya_skylark05',
      'sticker-pack-name': metadata.packname,
      'sticker-pack-publisher': metadata.author,
      'emojis': metadata.categories ? metadata.categories : ['']
    };

    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);

    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(tempInput);
    fs.unlinkSync(tempInput);
    img.exif = exif;
    await img.save(tempOutput);
    return tempOutput;
  }
}

async function writeExifVid(buffer, metadata) {
  let webpBuffer = await videoToWebp(buffer);
  const tempInput = path.join(tmpdir(), makeid(10) + '.webp');
  const tempOutput = path.join(tmpdir(), makeid(10) + '.webp');

  fs.writeFileSync(tempInput, webpBuffer);

  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': 'https://instagram.com/surya_skylark05',
      'sticker-pack-name': metadata.packname,
      'sticker-pack-publisher': metadata.author,
      'emojis': metadata.categories ? metadata.categories : ['']
    };

    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);

    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(tempInput);
    fs.unlinkSync(tempInput);
    img.exif = exif;
    await img.save(tempOutput);
    return tempOutput;
  }
}

async function writeExif(media, metadata) {
  let webpBuffer = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media.data) : /video/.test(media.mimetype) ? await videoToWebp(media.data) : '';

  const tempInput = path.join(tmpdir(), makeid(10) + '.webp');
  const tempOutput = path.join(tmpdir(), makeid(10) + '.webp');

  fs.writeFileSync(tempInput, webpBuffer);

  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': 'https://instagram.com/surya_skylark05',
      'sticker-pack-name': metadata.packname,
      'sticker-pack-publisher': metadata.author,
      'emojis': metadata.categories ? metadata.categories : ['']
    };

    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);

    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(tempInput);
    fs.unlinkSync(tempInput);
    img.exif = exif;
    await img.save(tempOutput);
    return tempOutput;
  }
}

export {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  writeExif
};