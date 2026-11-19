# 🐼 FilePanda

### Every File. Made Simple.

**FilePanda** is a free, browser-based file compression and conversion platform designed to make everyday file management fast, simple, and accessible.

Compress images, convert formats, manage PDF documents, create ZIP archives, and experiment with video compression — all from one modern interface.

🌐 **Live Website:** [https://parasbuilds.github.io/filepanda/](https://parasbuilds.github.io/filepanda/)

## ✨ Features

### 🖼️ Image Tools

- **Smart Image Compressor** — Reduce image file sizes with adjustable quality settings.
- **Image Converter** — Convert between JPG, PNG, and WebP formats.
- **Image Resizer** — Resize images while maintaining their aspect ratio.

### 📄 PDF Tools

- **Merge PDF** — Combine multiple PDF documents into one file.
- **Split PDF** — Extract selected pages or page ranges.
- **Images to PDF** — Convert multiple images into a single PDF document.

### 📦 ZIP Tools

- **Create ZIP** — Package multiple files into a ZIP archive.
- **Extract ZIP** — Extract and download individual files from ZIP archives.

### 🎬 Video Tools (Experimental)

- **Video Compressor** — Adjust video resolution, bitrate, and frame rate.
- **Video Converter** — Convert compatible video inputs to WebM using supported browser APIs.

Video encoding and audio preservation depend on browser compatibility. The video tools are still being tested.

## 🚀 Why FilePanda?

- **Free to use** — No subscription required.
- **Privacy-focused** — File processing takes place locally in the browser.
- **No registration** — Start using the tools without creating an account.
- **Responsive design** — Works across desktop and mobile screen sizes.
- **Simple interface** — Drag-and-drop uploads and straightforward downloads.
- **Multiple formats** — PDF, JPG, PNG, WebP, ZIP, and compatible video files.

## 🛠️ Technology Stack

| Technology        | Purpose                       |
| ----------------- | ----------------------------- |
| HTML5             | Website structure             |
| CSS3              | Styling and responsive layout |
| JavaScript        | Application logic             |
| PDF-Lib           | PDF processing                |
| JSZip             | ZIP creation and extraction   |
| Canvas API        | Image manipulation            |
| MediaRecorder API | Experimental video encoding   |
| GitHub Pages      | Static website hosting        |

FilePanda does not currently require a dedicated backend server.

## 📁 Project Structure

```text
filepanda/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── privacy.html
├── terms.html
└── README.md
```

## 💻 Run Locally

1. Clone the repository:

```bash
git clone https://github.com/ParasBuilds/filepanda.git
```

2. Navigate into the project:

```bash
cd filepanda
```

3. Start a local development server:

```bash
python -m http.server 8000
```

4. Open your browser and visit:

```text
http://localhost:8000
```

An internet connection is currently required to load some third-party libraries and fonts.

## 🌍 Deployment

FilePanda is currently hosted using GitHub Pages.

**Live URL:** [https://parasbuilds.github.io/filepanda/](https://parasbuilds.github.io/filepanda/)

The website deploys automatically when changes are committed to the configured `main` branch.

For a future commercial launch, migration to a suitable hosting platform such as Cloudflare Pages is planned.

## 🔐 Privacy

FilePanda's current file-processing tools run within the user's browser rather than uploading selected files to a FilePanda processing server.

Third-party scripts and hosting services may still receive standard network request information.

See [Privacy Policy](privacy.html) for details.

## ⚠️ Current Limitations

- Video encoding is experimental and browser-dependent.
- Some video outputs may not preserve audio.
- Large files may exceed available device memory.
- Password-protected or damaged PDFs may fail.
- ZIP extraction is not yet hardened for large or untrusted archives.
- Some compression operations may produce files larger than the originals.
- Browser compatibility and production security testing are ongoing.

## 🗺️ Development Roadmap

- [x] Responsive website interface
- [x] Image compression, conversion, and resizing
- [x] PDF merging and splitting
- [x] Images to PDF conversion
- [x] ZIP creation and extraction
- [x] Premium FilePanda 3.0 interface implementation
- [x] Experimental video processing implementation
- [ ] Complete video compatibility testing
- [ ] Improve video encoding and audio preservation
- [ ] Add advanced PDF compression
- [ ] Add batch image processing
- [ ] Add image and video previews
- [ ] Improve security and performance
- [ ] Add dedicated SEO pages
- [ ] Migrate to commercial-compatible hosting
- [ ] Prepare Google AdSense integration

## 🤝 Contributions

Suggestions, bug reports, and contributions are welcome.

If you encounter a problem, open an issue in this repository and describe the steps needed to reproduce it.

## 📜 License

No open-source license has been selected yet. All rights remain reserved unless a license is added to the repository.

---

**🐼 FilePanda — Every File. Made Simple.**

Built with HTML, CSS, and JavaScript.
