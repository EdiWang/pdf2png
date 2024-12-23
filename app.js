pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const pageSelection = document.getElementById('pageSelection');
const exportButton = document.getElementById('exportButton');
const downloadLinks = document.getElementById('downloadLinks');
const canvasContainer = document.getElementById('canvasContainer');

let pdfDoc = null; // Store the loaded PDF document
let fileName = null;

let allSelected = false;
selectAllButton.addEventListener('click', function () {
    const checkboxes = pageSelection.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allSelected;
    });

    allSelected = !allSelected;
    selectAllButton.textContent = allSelected ? 'Deselect All' : 'Select All';
});

function getSelectedScale() {
    const selectedScale = document.querySelector('input[name="scale"]:checked');
    return selectedScale ? parseFloat(selectedScale.value) : 1.5;
}

fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('Please upload a valid PDF file.');
        return;
    }

    fileName = file.name.replace(/\.pdf$/i, '');
    const fileReader = new FileReader();

    fileReader.onload = function () {
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: './cmaps/',
            cMapPacked: true
        }).promise.then(pdf => {
            pdfDoc = pdf;
            generatePageSelection(pdf.numPages);
        }).catch(error => {
            console.error('Error loading PDF:', error);
            alert('Failed to load PDF. Please try again.');
        });
    };

    fileReader.readAsArrayBuffer(file);
});

// Generate checkboxes for page selection
function generatePageSelection(numPages) {
    pageSelection.innerHTML = ''; // Clear previous checkboxes
    for (let i = 1; i <= numPages; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `page-${i}`;
        checkbox.value = i;
        checkbox.className = 'form-check-input me-2';

        if (i === 1) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = `page-${i}`;
        label.className = 'form-check-label';
        label.textContent = `Page ${i}`;

        const div = document.createElement('div');
        div.className = 'form-check';
        div.appendChild(checkbox);
        div.appendChild(label);

        pageSelection.appendChild(div);
    }
    exportButton.disabled = false; // Enable the export button
}

// Export selected pages as PNG
exportButton.addEventListener('click', function () {
    const selectedPages = Array.from(pageSelection.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    if (selectedPages.length === 0) {
        alert('Please select at least one page to export.');
        return;
    }

    downloadLinks.innerHTML = ''; // Clear previous download links
    canvasContainer.innerHTML = ''; // Clear previous canvases

    const scale = getSelectedScale();
    console.info('Exporting pages:', selectedPages, 'with scale:', scale);

    selectedPages.forEach(pageNumber => {
        renderPageToPNG(pageNumber, scale);
    });
});

// Render a specific page to PNG and create a download link
function renderPageToPNG(pageNumber, scale) {
    pdfDoc.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale });

        // Create a new canvas for each page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'border shadow-sm';
        canvasContainer.appendChild(canvas);

        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        page.render(renderContext).promise.then(() => {
            const imageData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `${fileName}-page-${pageNumber}.png`;
            link.className = 'btn btn-success me-2 mb-2';
            link.textContent = `Download Page ${pageNumber}`;
            downloadLinks.appendChild(link);
        });
    }).catch(error => {
        console.error(`Error rendering page ${pageNumber}:`, error);
        alert(`Failed to render page ${pageNumber}.`);
    });
}