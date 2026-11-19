
'use strict';

// FilePanda 3.2
// Image, PDF, ZIP and video processing.

const tools = [
  {id:'compress',name:'Smart Image Compressor',icon:'🖼️',category:'image',desc:'Reduce image size while balancing quality.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'convert',name:'Convert Image',icon:'🔄',category:'image',desc:'Convert JPG, PNG and WebP images.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'resize',name:'Resize Image',icon:'📐',category:'image',desc:'Resize images while preserving proportions.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'imagespdf',name:'Images to PDF',icon:'📄',category:'pdf',desc:'Turn multiple images into one PDF.',accept:'image/jpeg,image/png,image/webp',multiple:true},
  {id:'merge',name:'Merge PDF',icon:'📚',category:'pdf',desc:'Combine multiple PDF documents.',accept:'.pdf,application/pdf',multiple:true},
  {id:'split',name:'Split PDF',icon:'✂️',category:'pdf',desc:'Extract selected PDF pages.',accept:'.pdf,application/pdf',multiple:false},
  {id:'zip',name:'Create ZIP',icon:'🗜️',category:'zip',desc:'Package multiple files into a ZIP archive.',accept:'',multiple:true},
  {id:'unzip',name:'Extract ZIP',icon:'📦',category:'zip',desc:'Extract and download ZIP contents.',accept:'.zip,application/zip,application/x-zip-compressed',multiple:false},
  {id:'video',name:'Video Compressor',icon:'🎬',category:'video',desc:'Compress videos into MP4 or WebM.',accept:'video/*',multiple:false}
];

const $ = id => document.getElementById(id);

let active = tools[0];
let selected = [];
let category = 'all';
let busy = false;
const urls = [];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576)
    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function status(message, error = false) {
  $('status').textContent = message;
  $('status').style.color = error ? '#dc2626' : '#15803d';
}

function progress(percent, message) {
  $('progressWrap').hidden = false;
  const p = Math.max(0, Math.min(100, percent));
  $('progressBar').style.width = p + '%';
  $('progressPercent').textContent = Math.round(p) + '%';
  $('progressText').textContent = message;
}

function clearProgress() {
  $('progressWrap').hidden = true;
  $('progressBar').style.width = '0%';
}

function cleanup() {
  urls.splice(0).forEach(URL.revokeObjectURL);
  $('results').replaceChildren();
  clearProgress();
  status('');
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  urls.push(url);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.className = 'download';
  a.textContent = '↓ Download ' + name;
  $('results').appendChild(a);
}

function resultInfo(text) {
  const div = document.createElement('div');
  div.className = 'result';
  div.textContent = text;
  $('results').appendChild(div);
}

function render() {
  const query = $('search').value.toLowerCase().trim();
  $('grid').replaceChildren();

  const matches = tools.filter(t =>
    (category === 'all' || t.category === category) &&
    (t.name + ' ' + t.desc).toLowerCase().includes(query)
  );

  $('toolCount').textContent = matches.length + ' tools';

  matches.forEach(t => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-card' +
      (t.id === active.id ? ' active' : '');

    button.innerHTML = `
      <span class="arrow">↗</span>
      <span class="tool-icon">${t.icon}</span>
      <strong>${t.name}</strong>
      <small>${t.desc}</small>
    `;

    button.onclick = () => {
      choose(t.id);
      $('workspace').scrollIntoView({behavior:'smooth'});
    };

    $('grid').appendChild(button);
  });
}

function addOption(label, html) {
  const element = document.createElement('label');
  element.textContent = label;

  const wrapper = document.createElement('span');
  wrapper.innerHTML = html;
  element.appendChild(wrapper);
  $('options').appendChild(element);
}

function choose(id) {
  if (busy) return;

  active = tools.find(t => t.id === id);
  selected = [];

  $('files').value = '';
  $('files').accept = active.accept;
  $('files').multiple = active.multiple;

  $('toolTitle').textContent = active.name;
  $('toolDesc').textContent = active.desc;

  $('fileList').replaceChildren();
  $('options').replaceChildren();

  $('runLabel').textContent =
    id === 'video' ? 'Compress video' : 'Process files';

  cleanup();

  if (['compress','convert','resize'].includes(id)) {
    addOption('Output format', `
      <select id="format">
        <option value="original">Keep original</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/png">PNG</option>
        <option value="image/webp">WebP</option>
      </select>
    `);

    if (id === 'compress') {
      addOption('Maximum quality', `
        <input id="quality" type="range"
          min="35" max="95" value="78">
      `);
    }

    if (id === 'resize') {
      addOption('New width (pixels)', `
        <input id="width" type="number"
          min="1" max="12000" placeholder="1200">
      `);
    }
  }

  if (id === 'split') {
    addOption('Pages to extract', `
      <input id="pages" type="text"
        placeholder="1,3-5">
    `);
  }

  if (id === 'video') {
    addOption('Output format', `
      <select id="videoFormat">
        <option value="mp4">MP4 (recommended)</option>
        <option value="webm">WebM (experimental)</option>
      </select>
    `);

    addOption('Maximum resolution', `
      <select id="resolution">
        <option value="original">Original</option>
        <option value="1080">1080p</option>
        <option value="720" selected>720p</option>
        <option value="480">480p</option>
        <option value="360">360p</option>
      </select>
    `);

    addOption('Video bitrate', `
      <select id="bitrate">
        <option value="2500000">High (2.5 Mbps)</option>
        <option value="1200000" selected>Balanced (1.2 Mbps)</option>
        <option value="600000">Small (600 Kbps)</option>
        <option value="350000">Very small (350 Kbps)</option>
      </select>
    `);

    addOption('Frame rate', `
      <select id="fps">
        <option value="30">30 FPS</option>
        <option value="24">24 FPS</option>
        <option value="15">15 FPS</option>
      </select>
    `);
  }

  render();
}

function setFiles(files) {
  if (busy) return;

  const all = Array.from(files);
  selected = active.multiple ? all : all.slice(0,1);

  $('fileList').replaceChildren();
  cleanup();

  selected.forEach(file => {
    const row = document.createElement('div');
    row.className = 'file-item';

    const name = document.createElement('span');
    const size = document.createElement('span');

    name.textContent = '📎 ' + file.name;
    size.textContent = formatSize(file.size);

    row.append(name,size);
    $('fileList').appendChild(row);
  });
}

// IMAGE ENGINE

function imageType(file) {
  return ['image/jpeg','image/png','image/webp']
    .includes(file.type) ? file.type : 'image/png';
}

function extension(type) {
  return type === 'image/jpeg' ? 'jpg' :
    type === 'image/png' ? 'png' : 'webp';
}

async function encodeImage(file, quality, type, width) {
  const bitmap = await createImageBitmap(file);

  try {
    const w = width || bitmap.width;
    const h = Math.round(bitmap.height * w / bitmap.width);

    if (w < 1 || h < 1 ||
        w > 12000 || h > 12000 ||
        w * h > 50000000)
      throw Error('Image exceeds supported dimensions.');

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Canvas unavailable.');

    if (type === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,w,h);
    }

    ctx.drawImage(bitmap,0,0,w,h);

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve,type,quality)
    );

    if (!blob || blob.type !== type)
      throw Error('Browser cannot encode this format.');

    return blob;
  } finally {
    bitmap.close();
  }
}

async function processImage() {
  const file = selected[0];

  if (!['image/jpeg','image/png','image/webp']
      .includes(file.type))
    throw Error('Select a JPG, PNG or WebP image.');

  const original = imageType(file);
  const choice = $('format').value;
  const type = choice === 'original' ? original : choice;

  let blob;

  if (active.id === 'compress') {
    progress(10,'Compressing image...');

    const max = Number($('quality').value) / 100;
    const qualities = [
      max,
      Math.max(.35,max-.12),
      Math.max(.35,max-.24)
    ];

    const candidates = [];

    for (let i=0;i<qualities.length;i++) {
      candidates.push(
        await encodeImage(file,qualities[i],type)
      );
      progress(20+(i+1)*23,'Trying compression settings...');
    }

    blob = candidates.reduce((a,b) =>
      a.size < b.size ? a : b
    );

    if (type === original && blob.size >= file.size)
      blob = file;

  } else if (active.id === 'resize') {
    const width = Number($('width').value);

    if (!Number.isInteger(width) || width < 1)
      throw Error('Enter a valid target width.');

    blob = await encodeImage(file,.9,type,width);
  } else {
    blob = await encodeImage(file,.9,type);
  }

  progress(100,'Finished');

  resultInfo(
    'Original: ' + formatSize(file.size) +
    ' | Output: ' + formatSize(blob.size) +
    ' | Change: ' +
    ((1-blob.size/file.size)*100).toFixed(1) +
    '% saved'
  );

  download(
    blob,
    'filepanda-'+active.id+'.'+extension(type)
  );

  status('Image ready.');
}

// PDF ENGINE

async function processPDF() {
  if (!window.PDFLib)
    throw Error('PDF library failed to load.');

  const {PDFDocument} = window.PDFLib;
  const output = await PDFDocument.create();

  if (active.id === 'merge') {
    if (selected.length < 2)
      throw Error('Select at least two PDFs.');

    for (let i=0;i<selected.length;i++) {
      progress(i/selected.length*90,'Merging PDFs...');

      const source = await PDFDocument.load(
        await selected[i].arrayBuffer()
      );

      const pages = await output.copyPages(
        source,source.getPageIndices()
      );

      pages.forEach(p => output.addPage(p));
    }

  } else if (active.id === 'split') {
    const source = await PDFDocument.load(
      await selected[0].arrayBuffer()
    );

    const count = source.getPageCount();
    const ids = [];
    const text = $('pages').value.trim();

    if (!text)
      throw Error('Enter page numbers, e.g. 1,3-5.');

    for (const token of text.split(',')) {
      const match = token.trim()
        .match(/^(\d+)(?:\s*-\s*(\d+))?$/);

      if (!match)
        throw Error('Invalid page range.');

      const start = +match[1];
      const end = match[2] ? +match[2] : start;

      if (start < 1 || end > count || end < start)
        throw Error('Pages must be within 1–'+count);

      for (let n=start;n<=end;n++)
        if (!ids.includes(n-1)) ids.push(n-1);
    }

    const pages = await output.copyPages(source,ids);
    pages.forEach(p => output.addPage(p));

  } else {
    for (let i=0;i<selected.length;i++) {
      const file = selected[i];

      if (!['image/jpeg','image/png','image/webp']
          .includes(file.type))
        throw Error('Select supported images.');

      progress(i/selected.length*90,'Adding images...');

      const blob = await encodeImage(
        file,.9,'image/jpeg'
      );

      const img = await output.embedJpg(
        await blob.arrayBuffer()
      );

      const scale = Math.min(
        1,1440/Math.max(img.width,img.height)
      );

      const w = img.width*scale;
      const h = img.height*scale;

      const page = output.addPage([w,h]);
      page.drawImage(img,{x:0,y:0,width:w,height:h});
    }
  }

  const bytes = await output.save();
  progress(100,'PDF ready');

  download(
    new Blob([bytes],{type:'application/pdf'}),
    'filepanda-'+active.id+'.pdf'
  );

  status('PDF ready: '+formatSize(bytes.length));
}

// ZIP ENGINE

async function processZIP() {
  if (!window.JSZip)
    throw Error('ZIP library failed to load.');

  if (active.id === 'zip') {
    const zip = new JSZip();

    selected.forEach(file =>
      zip.file(file.name,file)
    );

    const blob = await zip.generateAsync({
      type:'blob',
      compression:'DEFLATE',
      compressionOptions:{level:6}
    },meta =>
      progress(meta.percent,'Creating ZIP...')
    );

    download(blob,'filepanda-archive.zip');
    status('ZIP ready: '+formatSize(blob.size));

  } else {
    const archive = await JSZip.loadAsync(selected[0]);

    const entries = Object.entries(archive.files)
      .filter(([,entry]) => !entry.dir);

    if (entries.length > 150)
      throw Error('Archive exceeds the 150-file limit.');

    let count = 0;

    for (const [name,entry] of entries) {
      const blob = await entry.async('blob');
      const safeName = name.split('/').pop() ||
        'file-'+(count+1);

      download(blob,safeName);
      count++;

      progress(
        count/entries.length*100,
        'Extracting ZIP...'
      );
    }

    status(count+' files extracted.');
  }
}

// WEBM ENGINE - EXPERIMENTAL
// Retained as an optional browser-based fallback.

async function processWebM() {
  const file = selected[0];

  if (!window.MediaRecorder ||
      !HTMLCanvasElement.prototype.captureStream)
    throw Error('WebM encoding is unsupported.');

  const mime = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ].find(t => MediaRecorder.isTypeSupported(t));

  if (!mime)
    throw Error('No supported WebM encoder found.');

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');

  video.src = url;
  video.preload = 'auto';
  video.playsInline = true;
  video.muted = true;

  let stream, sourceStream, recorder, timer;
  let frameId = null;

  try {
    await new Promise((resolve,reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () =>
        reject(Error('Cannot decode video.'));
    });

    const duration = video.duration;

    if (!Number.isFinite(duration) || duration <= 0)
      throw Error('Invalid video duration.');

    const maxHeight =
      $('resolution').value === 'original'
        ? video.videoHeight
        : Number($('resolution').value);

    const ratio = Math.min(
      1,maxHeight/video.videoHeight
    );

    const width = Math.max(
      2,Math.round(video.videoWidth*ratio/2)*2
    );

    const height = Math.max(
      2,Math.round(video.videoHeight*ratio/2)*2
    );

    if (width*height > 3840*2160)
      throw Error('Maximum resolution is 4K.');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    stream = canvas.captureStream(
      Number($('fps').value)
    );

    if (typeof video.captureStream === 'function') {
      try {
        sourceStream = video.captureStream();

        sourceStream.getAudioTracks().forEach(track =>
          stream.addTrack(track)
        );
      } catch {
        // Audio capture is browser-dependent.
      }
    }

    const chunks = [];

    recorder = new MediaRecorder(stream,{
      mimeType:mime,
      videoBitsPerSecond:Number($('bitrate').value)
    });

    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };

    const finished = new Promise((resolve,reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () =>
        reject(Error('WebM encoding failed.'));
    });

    function draw() {
      if (video.paused || video.ended) return;

      ctx.drawImage(video,0,0,width,height);
      frameId = requestAnimationFrame(draw);
    }

    video.addEventListener('ended',() => {
      if (recorder.state === 'recording')
        recorder.stop();
    },{once:true});

    await video.play();
    ctx.drawImage(video,0,0,width,height);
    recorder.start(1000);
    draw();

    timer = setInterval(() => {
      progress(
        Math.min(99,video.currentTime/duration*100),
        'Encoding WebM...'
      );

      if (video.ended && recorder.state === 'recording')
        recorder.stop();
    },350);

    await finished;

    if (!chunks.length)
      throw Error('No video output generated.');

    let blob = new Blob(chunks,{
      type:recorder.mimeType
    });

    if (typeof window.fixWebmDuration === 'function') {
      blob = await new Promise(resolve => {
        try {
          window.fixWebmDuration(
            blob,
            Math.round(duration*1000),
            fixed => resolve(fixed || blob),
            {logger:false}
          );
        } catch {
          resolve(blob);
        }
      });
    }

    progress(100,'WebM ready');

    resultInfo(
      'Original: '+formatSize(file.size)+
      ' | Output: '+formatSize(blob.size)+
      ' | Change: '+
      ((1-blob.size/file.size)*100).toFixed(1)+
      '% saved. Verify seeking and audio.'
    );

    download(blob,'filepanda-video.webm');
    status('WebM ready.');

  } finally {
    if (timer) clearInterval(timer);
    if (frameId !== null)
      cancelAnimationFrame(frameId);

    video.pause();

    if (recorder && recorder.state === 'recording')
      recorder.stop();

    if (stream)
      stream.getTracks().forEach(t => t.stop());

    if (sourceStream)
      sourceStream.getTracks().forEach(t => t.stop());

    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

// MP4 ENGINE - FFMPEG.WASM

async function processMP4() {
  const file = selected[0];

  if (typeof compressMP4 !== 'function')
    throw Error(
      'FFmpeg engine is missing. Check js/video-engine.js.'
    );

  if (file.size > 100*1024*1024)
    throw Error(
      'For initial testing, use a video smaller than 100 MB.'
    );

  progress(5,'Loading MP4 encoder...');

  const blob = await compressMP4(
    file,
    {
      resolution:$('resolution').value,
      bitrate:$('bitrate').value,
      fps:$('fps').value
    },
    message => status(message)
  );

  progress(100,'MP4 ready');

  resultInfo(
    'Original: '+formatSize(file.size)+
    ' | Output: '+formatSize(blob.size)+
    ' | Change: '+
    ((1-blob.size/file.size)*100).toFixed(1)+
    '% saved'
  );

  download(blob,'filepanda-video.mp4');

  status(
    'MP4 ready. Verify playback, duration, seeking and audio.'
  );
}

// MAIN PROCESSOR

async function process() {
  if (busy) return;

  cleanup();

  if (!selected.length) {
    status('Please select a file first.',true);
    return;
  }

  busy = true;
  $('run').disabled = true;
  $('reset').disabled = true;

  status('Processing your files...');

  try {
    if (['compress','convert','resize']
        .includes(active.id)) {
      await processImage();

    } else if (['merge','split','imagespdf']
        .includes(active.id)) {
      await processPDF();

    } else if (['zip','unzip'].includes(active.id)) {
      await processZIP();

    } else if (active.id === 'video') {
      const file = selected[0];

      if (!file.type.startsWith('video/'))
        throw Error('Select a video file.');

      if ($('videoFormat').value === 'webm')
        await processWebM();
      else
        await processMP4();
    }

  } catch (error) {
    console.error('FilePanda error:',error);
    status(error.message || 'Processing failed.',true);
    clearProgress();

  } finally {
    busy = false;
    $('run').disabled = false;
    $('reset').disabled = false;
  }
}

// EVENT LISTENERS

$('search').addEventListener('input',render);

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click',() => {
    category = button.dataset.category;

    document.querySelectorAll('.filter').forEach(b =>
      b.classList.toggle('active',b === button)
    );

    render();
  });
});

$('files').addEventListener('change',event =>
  setFiles(event.target.files)
);

$('drop').addEventListener('click',() =>
  $('files').click()
);

$('drop').addEventListener('keydown',event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    $('files').click();
  }
});

$('drop').addEventListener('dragover',event => {
  event.preventDefault();
  $('drop').classList.add('drag');
});

$('drop').addEventListener('dragleave',() =>
  $('drop').classList.remove('drag')
);

$('drop').addEventListener('drop',event => {
  event.preventDefault();
  $('drop').classList.remove('drag');
  setFiles(event.dataTransfer.files);
});

$('run').addEventListener('click',process);

$('reset').addEventListener('click',() =>
  choose(active.id)
);

choose('compress');
