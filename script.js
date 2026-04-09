let canvas;
let cropper;
let currentFile = null;
const currentRatio = { w: 16, h: 9 };

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    setupEventListeners();
});

function initCanvas() {
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Initial setup 16:9
    const targetWidth = 800;
    const targetHeight = (targetWidth / 16) * 9;

    canvas = new fabric.Canvas('main-canvas', {
        width: targetWidth,
        height: targetHeight,
        backgroundColor: '#111',
        preserveObjectStacking: true
    });

    resizeCanvasDisplay();
}

function resizeCanvasDisplay() {
    const container = document.getElementById('canvas-container');
    const padding = 40;
    const maxWidth = container.offsetWidth - padding;
    const maxHeight = container.offsetHeight - padding;

    const ratio = currentRatio.w / currentRatio.h;
    let canvasWidth = maxWidth;
    let canvasHeight = maxWidth / ratio;

    if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * ratio;
    }

    canvas.setDimensions({
        width: canvasWidth,
        height: canvasHeight
    }, { backstoreOnly: false });
    
    // Recenter canvas visual representation
    const wrapper = document.querySelector('.canvas-container');
    if(wrapper) {
        wrapper.style.width = canvasWidth + 'px';
        wrapper.style.height = canvasHeight + 'px';
    }
}

function setupEventListeners() {
    // Ratio Switchers
    document.getElementById('btn-16-9').addEventListener('click', (e) => setRatio(16, 9, e.target));
    document.getElementById('btn-9-16').addEventListener('click', (e) => setRatio(9, 16, e.target));

    // File Upload
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileUpload);

    // Modal Controls
    document.querySelector('.close').onclick = closeModal;
    document.getElementById('btn-cancel-crop').onclick = closeModal;
    document.getElementById('btn-confirm-crop').onclick = finalizeCrop;

    // Clear Canvas
    document.getElementById('btn-clear').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            canvas.clear();
            canvas.backgroundColor = '#111';
            canvas.renderAll();
        }
    });

    // Save Image
    document.getElementById('btn-save').addEventListener('click', saveCollage);

    // Resize window handling
    window.addEventListener('resize', resizeCanvasDisplay);
}

function setRatio(w, h, btn) {
    currentRatio.w = w;
    currentRatio.h = h;
    
    document.querySelectorAll('.ratio-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    resizeCanvasDisplay();
}

function handleFileUpload(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    // Process first file or sequential loop
    // For this simple version, we'll process them one by one or just the first
    processImage(files[0]);
    // Clear input so same file can be selected again
    e.target.value = '';
}

function processImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const imgElement = document.getElementById('crop-image-preview');
        imgElement.src = event.target.result;
        openModal();

        if (cropper) cropper.destroy();
        cropper = new Cropper(imgElement, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);
}

function openModal() {
    document.getElementById('crop-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('crop-modal').style.display = 'none';
    if (cropper) cropper.destroy();
}

function finalizeCrop() {
    const croppedCanvas = cropper.getCroppedCanvas();
    const dataUrl = croppedCanvas.toDataURL('image/png');

    fabric.Image.fromURL(dataUrl, (img) => {
        // Scale image to fit nicely if it's too large
        if (img.width > canvas.width / 2) {
            img.scaleToWidth(canvas.width / 2);
        }
        
        img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
            cornerColor: '#6366f1',
            cornerStrokeColor: '#fff',
            cornerSize: 10,
            transparentCorners: false
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        closeModal();
    });
}

function saveCollage() {
    // Create a high-res export
    // We zoom in to 2x for better quality
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Export at 2x resolution
    });

    const link = document.createElement('a');
    link.download = `collage-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}