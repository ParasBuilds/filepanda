
'use strict';

// FilePanda 3.2 - FFmpeg.wasm MP4 engine.
// Single-threaded processing for static hosting.
// Loads the encoder only when a video is processed.

let ffmpegInstance = null;

async function loadVideoEngine(onStatus) {
  if (ffmpegInstance) return ffmpegInstance;

  onStatus('Downloading video processing engine...');

  const { FFmpeg } = await import(
    'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js'
  );

  const { toBlobURL } = await import(
    'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js'
  );

  const ffmpeg = new FFmpeg();

  const base =
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${base}/ffmpeg-core.js`,
      'text/javascript'
    ),
    wasmURL: await toBlobURL(
      `${base}/ffmpeg-core.wasm`,
      'application/wasm'
    )
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

async function compressMP4(file, settings, onProgress) {
  const ffmpeg = await loadVideoEngine(onProgress);

  const inputName = 'input-' + Date.now() + '.mp4';
  const outputName = 'output-' + Date.now() + '.mp4';

  try {
    onProgress('Preparing input video...');

    const bytes = new Uint8Array(await file.arrayBuffer());
    await ffmpeg.writeFile(inputName, bytes);

    const height = settings.resolution === 'original'
      ? null
      : Number(settings.resolution);

    const bitrate = Number(settings.bitrate);
    const fps = Number(settings.fps);

    const args = [
      '-i', inputName,
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-b:v', String(bitrate),
      '-pix_fmt', 'yuv420p'
    ];

    if (height) {
      args.push(
        '-vf',
        `scale=-2:${height}:force_original_aspect_ratio=decrease`
      );
    }

    args.push(
      '-r', String(fps),
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputName
    );

    onProgress('Encoding MP4. This may take several minutes...');

    const exitCode = await ffmpeg.exec(args);

    if (exitCode !== 0)
      throw new Error('FFmpeg encoding failed (code ' + exitCode + ').');

    const data = await ffmpeg.readFile(outputName);

    if (!data || !data.length)
      throw new Error('The video encoder produced no output.');

    return new Blob(
      [data.slice()],
      { type: 'video/mp4' }
    );

  } finally {
    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}
  }
}
