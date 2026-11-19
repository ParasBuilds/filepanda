
'use strict';

const tools = [
  {id:'compress',name:'Smart Image Compressor',icon:'🖼️',desc:'Reduce image size with adjustable quality',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'convert',name:'Convert Image',icon:'🔄',desc:'Convert between JPG, PNG and WebP',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'resize',name:'Resize Image',icon:'📐',desc:'Resize an image while keeping its proportions',accept:'image/jpeg,image/png,image/webp',multiple:false},
  {id:'imagespdf',name:'Images to PDF',icon:'📄',desc:'Combine images into a PDF document',accept:'image/jpeg,image/png,image/webp',multiple:true},
  {id:'merge',name:'Merge PDF',icon:'📚',desc:'Combine PDFs in selection order',accept:'.pdf,application/pdf',multiple:true},
  {id:'split',name:'Split PDF',icon:'✂️',desc:'Extract selected PDF pages',accept:'.pdf,application/pdf',multiple:false},
  {id:'zip',name:'Create ZIP',icon:'🗜️',desc:'Package several files into one archive',accept:'',multiple:true},
  {id:'unzip',name:'Extract ZIP',icon:'📦',desc:'Download individual files from a ZIP',accept:'.zip,application/zip,application/x-zip-compressed',multiple:false}
];

const $ = id => document.getElementById(id);
let active = tools[0], selected = [];
const objectUrls = [];

const size = n => n < 1024 ? `${n} B` :
  n < 1048576 ? `${(n/1024).toFixed(1)} KB` :
  `${(n/1048576).toFixed(2)} MB`;

function setStatus(message,error=false) {
  $('status').textContent = message;
  $('status').style.color = error ? '#b42318' : '#41684d';
}

function addDownload(blob,name) {
  const url = URL.createObjectURL(blob);
  objectUrls.push(url);
  const a = document.createElement('a');
  a.className = 'download';
  a.href = url;
  a.download = name;
  a.textContent = '⬇ ' + name;
  $('results').appendChild(a);
}

function cleanup() {
  objectUrls.splice(0).forEach(URL.revokeObjectURL);
  $('results').replaceChildren();
  setStatus('');
}

function render(filter='') {
  $('grid').replaceChildren();
  tools.filter(t => (t.name+' '+t.desc).toLowerCase()
    .includes(filter.toLowerCase())).forEach(t => {
    const b = document.createElement('button');
    b.className = 'tool' + (t.id===active.id ? ' active' : '');
    b.innerHTML = `<span class="symbol">${t.icon}</span>
      <strong>${t.name}</strong><small>${t.desc}</small>`;
    b.onclick = () => choose(t.id);
    $('grid').appendChild(b);
  });
}

function choose(id) {
  active = tools.find(t => t.id===id);
  selected = [];
  $('files').value = '';
  $('files').accept = active.accept;
  $('files').multiple = active.multiple;
  $('toolTitle').textContent = active.name;
  $('toolDesc').textContent = active.desc;
  $('fileHint').textContent = active.multiple ?
    'Select one or more files' : 'Select one file';
  $('fileList').replaceChildren();
  cleanup();

  const opts = $('options');
  opts.replaceChildren();

  function field(label,html) {
    const l = document.createElement('label');
    l.textContent = label;
    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    l.appendChild(wrap);
    opts.appendChild(l);
  }

  if (['compress','convert','resize'].includes(id)) {
    field('Output format',
      '<select id="format"><option value="original">Keep original</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select>');

    if (id==='compress')
      field('Quality / visual fidelity',
        '<input id="quality" type="range" min="35" max="95" value="78">');

    if (id==='resize')
      field('New width (px)',
        '<input id="width" type="number" min="1" max="12000" placeholder="e.g. 1200">');
  }

  if (id==='split')
    field('Pages to extract (e.g. 1,3-5)',
      '<input id="pages" type="text" placeholder="1,3-5">');

  render();
}

function setFiles(list) {
  const all = Array.from(list);
  selected = active.multiple ? all : all.slice(0,1);
  $('fileList').replaceChildren();

  selected.forEach(f => {
    const div = document.createElement('div');
    div.textContent = `📎 ${f.name} (${size(f.size)})`;
    $('fileList').appendChild(div);
  });

  cleanup();
}

function extension(type) {
  return type==='image/jpeg' ? 'jpg' :
    type==='image/png' ? 'png' : 'webp';
}

async function imageBlob(file,quality,format,width) {
  const bitmap = await createImageBitmap(file);
  try {
    const w = width || bitmap.width;
    const h = Math.round(bitmap.height*w/bitmap.width);

    if (w<1 || h<1 || w>12000 || h>12000 || w*h>50000000)
      throw Error('Image dimensions exceed the safe limit (50 megapixels).');

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw Error('Canvas is unavailable');

    if (format==='image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,w,h);
    }

    ctx.drawImage(bitmap,0,0,w,h);

    const blob = await new Promise(resolve =>
      c.toBlob(resolve,format,quality));

    if (!blob || blob.type!==format)
      throw Error('Your browser cannot encode this format');

    return blob;
  } finally {
    bitmap.close();
  }
}

async function imageTool() {
  const f = selected[0];
  if (!f.type.startsWith('image/'))
    throw Error('Choose a supported image');

  const requested = $('format').value;
  const originalType =
    ['image/jpeg','image/png','image/webp'].includes(f.type)
      ? f.type : 'image/png';
  const type = requested==='original' ? originalType : requested;
  let blob;

  if (active.id==='compress') {
    const max = Number($('quality').value)/100;
    const candidates = [];

    for (const q of [max,Math.max(.35,max-.12),Math.max(.35,max-.24)]) {
      const b = await imageBlob(f,q,type);
      candidates.push({b,q});
    }

    candidates.sort((a,b) => a.b.size-b.b.size);
    blob = candidates[0].b;

    if (type===originalType && blob.size>=f.size) {
      blob = f;
      setStatus(`Original is already smaller (${size(f.size)}). Returning the original.`);
    } else {
      setStatus(`${size(f.size)} → ${size(blob.size)} (${((1-blob.size/f.size)*100).toFixed(1)}% saved). Quality can affect appearance.`);
    }
  } else {
    const width = active.id==='resize' ?
      Number($('width').value) : undefined;

    if (active.id==='resize' &&
        (!Number.isInteger(width) || width<1))
      throw Error('Enter a valid target width');

    blob = await imageBlob(f,.9,type,width);
    setStatus(`${size(f.size)} → ${size(blob.size)}`);
  }

  addDownload(blob,`filepanda-${active.id}.${extension(type)}`);
}

async function pdfTool() {
  if (!window.PDFLib)
    throw Error('PDF library could not load. Check your internet connection.');

  const {PDFDocument} = window.PDFLib;
  const out = await PDFDocument.create();

  if (active.id==='merge') {
    if (selected.length<2)
      throw Error('Select at least two PDFs');

    for (const f of selected) {
      const src = await PDFDocument.load(await f.arrayBuffer());
      const pages = await out.copyPages(src,src.getPageIndices());
      pages.forEach(p => out.addPage(p));
    }

  } else if (active.id==='split') {
    const src = await PDFDocument.load(await selected[0].arrayBuffer());
    const count = src.getPageCount();
    const input = $('pages').value.trim();

    if (!input)
      throw Error('Enter page numbers or ranges');

    const ids = [];

    for (const token of input.split(',')) {
      const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw Error('Invalid page selection');

      const start = +match[1];
      const end = match[2] ? +match[2] : start;

      if (start<1 || end>count || end<start)
        throw Error(`Page selection must be within 1–${count}`);

      for (let n=start;n<=end;n++)
        if (!ids.includes(n-1)) ids.push(n-1);
    }

    const pages = await out.copyPages(src,ids);
    pages.forEach(p => out.addPage(p));

  } else {
    for (const f of selected) {
      if (!f.type.startsWith('image/'))
        throw Error('Select only images');

      const b = await imageBlob(f,.9,'image/jpeg');
      const bytes = await b.arrayBuffer();
      const img = await out.embedJpg(bytes);

      const w = img.width, h = img.height;
      const scale = Math.min(1,1440/Math.max(w,h));
      const page = out.addPage([w*scale,h*scale]);

      page.drawImage(img,{
        x:0,y:0,width:w*scale,height:h*scale
      });
    }
  }

  const bytes = await out.save();
  addDownload(
    new Blob([bytes],{type:'application/pdf'}),
    `filepanda-${active.id}.pdf`
  );
  setStatus(`PDF ready: ${size(bytes.length)}`);
}

async function zipTool() {
  if (!window.JSZip)
    throw Error('ZIP library could not load. Check your internet connection.');

  if (active.id==='zip') {
    const zip = new JSZip();
    selected.forEach(f => zip.file(f.name,f));

    const blob = await zip.generateAsync({
      type:'blob',
      compression:'DEFLATE',
      compressionOptions:{level:6}
    },m => setStatus(`Creating ZIP: ${Math.round(m.percent)}%`));

    addDownload(blob,'filepanda-archive.zip');
    setStatus(`ZIP ready: ${size(blob.size)}`);

  } else {
    const zip = await JSZip.loadAsync(selected[0]);
    let count = 0;

    for (const [name,entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      if (count >= 150)
        throw Error('Too many archive entries; limit is 150');

      const blob = await entry.async('blob');
      addDownload(blob,name.split('/').pop()||`file-${count+1}`);
      count++;
    }

    setStatus(`${count} files extracted. Download each file below.`);
  }
}

async function process() {
  cleanup();

  if (!selected.length) {
    setStatus('Choose a file first.',true);
    return;
  }

  const btn = $('run');
  btn.disabled = true;
  setStatus('Processing locally in your browser...');

  try {
    if (['compress','convert','resize'].includes(active.id))
      await imageTool();
    else if (['merge','split','imagespdf'].includes(active.id))
      await pdfTool();
    else
      await zipTool();
  } catch(e) {
    setStatus(e.message||'Processing failed. Check the file and try again.',true);
  } finally {
    btn.disabled = false;
  }
}

$('search').addEventListener('input',e=>render(e.target.value));
$('files').addEventListener('change',e=>setFiles(e.target.files));

$('drop').addEventListener('click',()=>$('files').click());

$('drop').addEventListener('keydown',e=>{
  if (e.key==='Enter'||e.key===' ') {
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
