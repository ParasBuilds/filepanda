
'use strict';

const tools = [
  {id:'compress',name:'Smart Image Compressor',icon:'🖼️',category:'image',desc:'Reduce image size while balancing quality.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'convert',name:'Convert Image',icon:'🔄',category:'image',desc:'Convert JPG, PNG and WebP images.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'resize',name:'Resize Image',icon:'📐',category:'image',desc:'Resize images while preserving proportions.',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'imagespdf',name:'Images to PDF',icon:'📄',category:'pdf',desc:'Turn multiple images into one PDF.',accept:'image/jpeg,image/png,image/webp',multiple:true},
  {id:'merge',name:'Merge PDF',icon:'📚',category:'pdf',desc:'Combine multiple PDF documents.',accept:'.pdf,application/pdf',multiple:true},
  {id:'split',name:'Split PDF',icon:'✂️',category:'pdf',desc:'Extract specific PDF pages.',accept:'.pdf,application/pdf',multiple:false},
  {id:'zip',name:'Create ZIP',icon:'🗜️',category:'zip',desc:'Compress multiple files into a ZIP archive.',accept:'',multiple:true},
  {id:'unzip',name:'Extract ZIP',icon:'📦',category:'zip',desc:'Extract and download ZIP contents.',accept:'.zip,application/zip,application/x-zip-compressed',multiple:false},
  {id:'video',name:'Video Compressor',icon:'🎬',category:'video',desc:'Convert compatible videos to WebM with bitrate and resolution controls.',accept:'video/*',multiple:false}
];

const $ = id => document.getElementById(id);
let active = tools[0];
let selected = [];
let category = 'all';
let busy = false;
const urls = [];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1048576).toFixed(2)+' MB';
}

function status(message,error=false) {
  $('status').textContent = message;
  $('status').style.color = error ? '#dc2626' : '#15803d';
}

function progress(percent,message) {
  $('progressWrap').hidden = false;
  const p = Math.min(100,Math.max(0,percent));
  $('progressBar').style.width = p+'%';
  $('progressPercent').textContent = Math.round(p)+'%';
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

function download(blob,name) {
  const url = URL.createObjectURL(blob);
  urls.push(url);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.className = 'download';
  a.textContent = '↓ Download '+name;
  $('results').appendChild(a);
}

function resultInfo(text) {
  const d = document.createElement('div');
  d.className = 'result';
  d.textContent = text;
  $('results').appendChild(d);
}

function render() {
  const query = $('search').value.toLowerCase().trim();
  $('grid').replaceChildren();

  const matches = tools.filter(t =>
    (category==='all'||t.category===category) &&
    (t.name+' '+t.desc).toLowerCase().includes(query)
  );

  $('toolCount').textContent = matches.length+' tools';

  matches.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tool-card'+(t.id===active.id?' active':'');
    b.type = 'button';
    b.innerHTML = `
      <span class="arrow">↗</span>
      <span class="tool-icon">${t.icon}</span>
      <strong>${t.name}</strong>
      <small>${t.desc}</small>`;
    b.onclick = () => {
      choose(t.id);
      $('workspace').scrollIntoView({behavior:'smooth'});
    };
    $('grid').appendChild(b);
  });
}

function addOption(label,html) {
  const el = document.createElement('label');
  el.textContent = label;
  const span = document.createElement('span');
  span.innerHTML = html;
  el.appendChild(span);
  $('options').appendChild(el);
}

function choose(id) {
  if (busy) return;
  active = tools.find(t=>t.id===id);
  selected = [];
  $('files').value = '';
  $('files').accept = active.accept;
  $('files').multiple = active.multiple;
  $('toolTitle').textContent = active.name;
  $('toolDesc').textContent = active.desc;
  $('fileList').replaceChildren();
  $('options').replaceChildren();
  $('runLabel').textContent =
    active.id==='video'?'Compress video':'Process files';
  cleanup();

  if (['compress','convert','resize'].includes(id)) {
    addOption('Output format',
      '<select id="format"><option value="original">Keep original</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select>');

    if (id==='compress')
      addOption('Maximum quality',
        '<input id="quality" type="range" min="35" max="95" value="78">');

    if (id==='resize')
      addOption('New width (pixels)',
        '<input id="width" type="number" min="1" max="12000" placeholder="1200">');
  }

  if (id==='split')
    addOption('Pages to extract',
      '<input id="pages" placeholder="1,3-5" aria-label="Page ranges">');

  if (id==='video') {
    addOption('Maximum resolution',
      '<select id="resolution"><option value="original">Original</option><option value="1080">1080p</option><option value="720" selected>720p</option><option value="480">480p</option><option value="360">360p</option></select>');
    addOption('Video bitrate',
      '<select id="bitrate"><option value="2500000">High (2.5 Mbps)</option><option value="1200000" selected>Balanced (1.2 Mbps)</option><option value="600000">Small (600 Kbps)</option><option value="350000">Very small (350 Kbps)</option></select>');
    addOption('Frame rate',
      '<select id="fps"><option value="30">30 FPS</option><option value="24">24 FPS</option><option value="15">15 FPS</option></select>');
  }
  render();
}

function setFiles(files) {
  if (busy) return;
  const all = Array.from(files);
  selected = active.multiple ? all : all.slice(0,1);
  $('fileList').replaceChildren();
  cleanup();

  selected.forEach(f=>{
    const row = document.createElement('div');
    row.className = 'file-item';
    const name = document.createElement('span');
    const size = document.createElement('span');
    name.textContent = '📎 '+f.name;
    size.textContent = formatSize(f.size);
    row.append(name,size);
    $('fileList').appendChild(row);
  });
}

function imageType(file) {
  return ['image/jpeg','image/png','image/webp'].includes(file.type)
    ? file.type : 'image/png';
}

function ext(type) {
  return type==='image/jpeg'?'jpg':
    type==='image/png'?'png':'webp';
}

async function encodeImage(file,quality,type,width) {
  const bitmap = await createImageBitmap(file);
  try {
    const w = width||bitmap.width;
    const h = Math.round(bitmap.height*w/bitmap.width);
    if (w<1||h<1||w>12000||h>12000||w*h>50000000)
      throw Error('Image exceeds supported dimensions.');

    const canvas = document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    const ctx=canvas.getContext('2d');
    if (!ctx) throw Error('Canvas unavailable.');

    if (type==='image/jpeg') {
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,w,h);
    }
    ctx.drawImage(bitmap,0,0,w,h);

    const blob=await new Promise(resolve=>
      canvas.toBlob(resolve,type,quality));

    if (!blob||blob.type!==type)
      throw Error('Browser cannot encode this image format.');
    return blob;
  } finally {
    bitmap.close();
  }
}

async function processImage() {
  const f=selected[0];
  if (!['image/jpeg','image/png','image/webp'].includes(f.type))
    throw Error('Select a JPG, PNG or WebP image.');

  const original=imageType(f);
  const choice=$('format').value;
  const type=choice==='original'?original:choice;
  let blob;

  if (active.id==='compress') {
    progress(10,'Compressing image...');
    const max=Number($('quality').value)/100;
    const qualities=[max,Math.max(.35,max-.12),Math.max(.35,max-.24)];
    const candidates=[];

    for (let i=0;i<qualities.length;i++) {
      candidates.push(await encodeImage(f,qualities[i],type));
      progress(20+(i+1)*23,'Trying compression settings...');
    }
    blob=candidates.reduce((a,b)=>a.size<b.size?a:b);

    if (type===original && blob.size>=f.size) blob=f;

  } else if (active.id==='resize') {
    const width=Number($('width').value);
    if (!Number.isInteger(width)||width<1)
      throw Error('Enter a valid target width.');
    blob=await encodeImage(f,.9,type,width);
  } else {
    blob=await encodeImage(f,.9,type);
  }

  progress(100,'Finished');
  resultInfo(
    `Original: ${formatSize(f.size)} | Output: ${formatSize(blob.size)} | Change: ${((1-blob.size/f.size)*100).toFixed(1)}% saved`
  );
  download(blob,'filepanda-'+active.id+'.'+ext(type));
  status('Image ready. Download your result.');
}

async function processPDF() {
  if (!window.PDFLib)
    throw Error('PDF library failed to load.');
  const {PDFDocument}=window.PDFLib;
  const out=await PDFDocument.create();

  if (active.id==='merge') {
    if (selected.length<2)
      throw Error('Select at least two PDFs.');

    for (let i=0;i<selected.length;i++) {
      progress((i/selected.length)*90,'Merging PDF files...');
      const src=await PDFDocument.load(await selected[i].arrayBuffer());
      const pages=await out.copyPages(src,src.getPageIndices());
      pages.forEach(p=>out.addPage(p));
    }

  } else if (active.id==='split') {
    const src=await PDFDocument.load(await selected[0].arrayBuffer());
    const count=src.getPageCount();
    const ids=[];
    const text=$('pages').value.trim();
    if (!text) throw Error('Enter page numbers, e.g. 1,3-5.');

    for (const token of text.split(',')) {
      const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) throw Error('Invalid page range.');
      const start=+m[1],end=m[2]?+m[2]:start;
      if (start<1||end>count||end<start)
        throw Error('Pages must be within 1–'+count);
      for(let n=start;n<=end;n++)
        if (!ids.includes(n-1)) ids.push(n-1);
    }
    const pages=await out.copyPages(src,ids);
    pages.forEach(p=>out.addPage(p));

  } else {
    for(let i=0;i<selected.length;i++) {
      const f=selected[i];
      if (!['image/jpeg','image/png','image/webp'].includes(f.type))
        throw Error('Select supported image files.');

      progress(i/selected.length*90,'Adding images to PDF...');
      const blob=await encodeImage(f,.9,'image/jpeg');
      const img=await out.embedJpg(await blob.arrayBuffer());
      const scale=Math.min(1,1440/Math.max(img.width,img.height));
      const w=img.width*scale,h=img.height*scale;
      const page=out.addPage([w,h]);
      page.drawImage(img,{x:0,y:0,width:w,height:h});
    }
  }

  const bytes=await out.save();
  progress(100,'PDF ready');
  download(new Blob([bytes],{type:'application/pdf'}),
    'filepanda-'+active.id+'.pdf');
  status('PDF created: '+formatSize(bytes.length));
}

async function processZIP() {
  if (!window.JSZip)
    throw Error('ZIP library failed to load.');

  if (active.id==='zip') {
    const zip=new JSZip();
    selected.forEach(f=>zip.file(f.name,f));

    const blob=await zip.generateAsync({
      type:'blob',
      compression:'DEFLATE',
      compressionOptions:{level:6}
    },meta=>progress(meta.percent,'Creating ZIP...'));

    download(blob,'filepanda-archive.zip');
    status('ZIP created: '+formatSize(blob.size));

  } else {
    const archive=await JSZip.loadAsync(selected[0]);
    const entries=Object.entries(archive.files)
      .filter(([,entry])=>!entry.dir);

    if (entries.length>150)
      throw Error('Archive exceeds the 150-file limit.');

    let count=0;
    for (const [name,entry] of entries) {
      const blob=await entry.async('blob');
      const safeName=name.split('/').pop()||'file-'+(count+1);
      download(blob,safeName);
      count++;
      progress(count/entries.length*100,'Extracting ZIP...');
    }
    status(count+' files extracted.');
  }
}

// VIDEO ENGINE
// Uses HTMLVideoElement, canvas.captureStream and MediaRecorder.
// Output is WebM. Encoding capabilities vary by browser.

function waitEvent(target,event,errorEvent='error') {
  return new Promise((resolve,reject)=>{
    const ok=()=>{clear();resolve();};
    const fail=()=>{clear();reject(Error('Video could not be decoded.'));};
    function clear() {
      target.removeEventListener(event,ok);
      target.removeEventListener(errorEvent,fail);
    }
    target.addEventListener(event,ok,{once:true});
    target.addEventListener(errorEvent,fail,{once:true});
  });
}

async function processVideo() {
  const file=selected[0];

  if (!file.type.startsWith('video/'))
    throw Error('Choose a video file.');
  if (!window.MediaRecorder)
    throw Error('This browser does not support video recording.');
  if (!HTMLCanvasElement.prototype.captureStream)
    throw Error('Canvas video capture is unsupported.');

  const mime=[
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ].find(t=>MediaRecorder.isTypeSupported(t));

  if (!mime)
    throw Error('WebM encoding is unavailable in this browser.');

  const sourceURL=URL.createObjectURL(file);
  const video=document.createElement('video');
  video.preload='auto';
  video.playsInline=true;
  video.muted=true;
  video.src=sourceURL;

  let timer=null;
  let recorder=null;
  let stream=null;
  let sourceStream=null;
  let stopRequested=false;

  try {
    await waitEvent(video,'loadedmetadata');

    if (!Number.isFinite(video.duration)||video.duration<=0)
      throw Error('Cannot determine video duration.');

    const maxHeight=$('resolution').value==='original'
      ?video.videoHeight:Number($('resolution').value);
    const ratio=Math.min(1,maxHeight/video.videoHeight);
    const w=Math.max(2,Math.round(video.videoWidth*ratio/2)*2);
    const h=Math.max(2,Math.round(video.videoHeight*ratio/2)*2);

    if (w*h>3840*2160)
      throw Error('Video exceeds the 4K processing limit.');

    const canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    const ctx=canvas.getContext('2d');
    if (!ctx) throw Error('Canvas unavailable.');

    const fps=Number($('fps').value);
    const bitrate=Number($('bitrate').value);

    stream=canvas.captureStream(fps);

    // Some browsers expose source audio tracks via captureStream.
    // When available, attach them to the output.
    if (typeof video.captureStream==='function') {
      try {
        sourceStream=video.captureStream();
        sourceStream.getAudioTracks().forEach(track=>
          stream.addTrack(track));
      } catch(e) {
        // Continue without audio when unsupported.
      }
    }

    const chunks=[];
    const hasAudio=stream.getAudioTracks().length>0;
    const chosenMime=hasAudio?mime:
      (['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
        .find(t=>MediaRecorder.isTypeSupported(t))||mime);

    recorder=new MediaRecorder(stream,{
      mimeType:chosenMime,
      videoBitsPerSecond:bitrate
    });

    recorder.ondataavailable=e=>{
      if(e.data.size) chunks.push(e.data);
    };

    const finished=new Promise((resolve,reject)=>{
      recorder.onstop=resolve;
      recorder.onerror=()=>reject(Error('Video encoding failed.'));
    });

    await video.play();
    recorder.start(1000);

    function draw() {
      if(video.paused||video.ended) return;
      ctx.drawImage(video,0,0,w,h);
      requestAnimationFrame(draw);
    }
    draw();

    timer=setInterval(()=>{
      const percent=Math.min(99,video.currentTime/video.duration*100);
      progress(percent,'Encoding video in real time...');
      if(video.ended&&!stopRequested) {
        stopRequested=true;
        recorder.stop();
      }
    },350);

    video.addEventListener('ended',()=>{
      if(recorder.state==='recording'&&!stopRequested) {
        stopRequested=true;
        recorder.stop();
      }
    },{once:true});

    await finished;

    if (!chunks.length)
      throw Error('No video data was produced.');

    const blob=new Blob(chunks,{type:recorder.mimeType});
    progress(100,'Video ready');

    resultInfo(
      `Original: ${formatSize(file.size)} | Output: ${formatSize(blob.size)} | Change: ${((1-blob.size/file.size)*100).toFixed(1)}% saved. ${hasAudio?'Audio track requested; verify playback.':'Audio not preserved by this browser.'}`
    );

    download(blob,'filepanda-video.webm');
    status('Video conversion completed. Check the downloaded video.');
  } finally {
    if(timer) clearInterval(timer);
    video.pause();
    if(recorder&&recorder.state==='recording') recorder.stop();
    if(stream) stream.getTracks().forEach(t=>t.stop());
    if(sourceStream) sourceStream.getTracks().forEach(t=>t.stop());
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(sourceURL);
  }
}

async function process() {
  if(busy) return;
  cleanup();
  if(!selected.length) {
    status('Please select a file first.',true);
    return;
  }

  busy=true;
  $('run').disabled=true;
  $('reset').disabled=true;
  status('Processing your files...');

  try {
    if(['compress','convert','resize'].includes(active.id))
      await processImage();
    else if(['merge','split','imagespdf'].includes(active.id))
      await processPDF();
    else if(['zip','unzip'].includes(active.id))
      await processZIP();
    else
      await processVideo();
  } catch(e) {
    status(e.message||'Processing failed.',true);
    clearProgress();
  } finally {
    busy=false;
    $('run').disabled=false;
    $('reset').disabled=false;
  }
}

$('search').addEventListener('input',render);

document.querySelectorAll('.filter').forEach(b=>{
  b.addEventListener('click',()=>{
    category=b.dataset.category;
    document.querySelectorAll('.filter').forEach(x=>
      x.classList.toggle('active',x===b));
    render();
  });
});

$('files').addEventListener('change',e=>setFiles(e.target.files));
$('drop').addEventListener('click',()=>$('files').click());

$('drop').addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' ') {
    e.preventDefault();
    $('files').click();
  }
});

$('drop').addEventListener('dragover',e=>{
  e.preventDefault();
  $('drop').classList.add('drag');
});
$('drop').addEventListener('dragleave',()=>
  $('drop').classList.remove('drag'));
$('drop').addEventListener('drop',e=>{
  e.preventDefault();
  $('drop').classList.remove('drag');
  setFiles(e.dataTransfer.files);
});

$('run').addEventListener('click',process);
$('reset').addEventListener('click',()=>choose(active.id));

choose('compress');
