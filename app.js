import * as pdfjsLib from '/lib/pdfjs/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.mjs';

const fileInput = document.getElementById('fileInput');
const pageSelection = document.getElementById('pageSelection');
const exportButton = document.getElementById('exportButton');
const canvasContainer = document.getElementById('canvasContainer');
const allPagesData = [];

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

            canvasContainer.innerHTML = ''; // Clear previous canvases
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
    exportButton.disabled = false;
}

// Export selected pages as PNG
exportButton.addEventListener('click', function () {
    const selectedPages = Array.from(pageSelection.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    if (selectedPages.length === 0) {
        alert('Please select at least one page to export.');
        return;
    }

    canvasContainer.innerHTML = '';

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

        // Create a container for the canvas and its download link
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        canvasContainer.appendChild(pageContainer);

        // Create a new canvas for the page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'border shadow-sm';
        pageContainer.appendChild(canvas);

        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        page.render(renderContext).promise.then(() => {
            const imageData = canvas.toDataURL('image/png');

            // Store the image data for "Download All" functionality
            allPagesData.push({
                pageNumber: pageNumber,
                imageData: imageData
            });

            // Create a download link for the canvas image
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `${fileName}-page-${pageNumber}.png`;
            link.className = 'btn btn-outline-secondary btn-download-link d-block mt-2';
            link.textContent = `Download Page ${pageNumber}`;
            pageContainer.appendChild(link);

            // Show the "Download All" button when all pages are rendered
            if (allPagesData.length > 0) {
                document.getElementById('downloadAllBtn').style.display = 'block';
            }
        });
    }).catch(error => {
        console.error(`Error rendering page ${pageNumber}:`, error);
        alert(`Failed to render page ${pageNumber}.`);
    });
}

// Function to download all pages as a ZIP file
function downloadAllPages() {
    const zip = new JSZip();
    const imgFolder = zip.folder('images'); // Create a folder for images in the ZIP

    // Add each page's image to the ZIP
    allPagesData.forEach(({ pageNumber, imageData }) => {
        const base64Data = imageData.split(',')[1]; // Remove the "data:image/png;base64," prefix
        imgFolder.file(`page-${pageNumber}.png`, base64Data, { base64: true });
    });

    // Generate the ZIP file and trigger the download
    zip.generateAsync({ type: 'blob' }).then(content => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${fileName}-all-pages.zip`;
        a.click();
    });
}

// Attach the "Download All" functionality to the button
document.getElementById('downloadAllBtn').addEventListener('click', downloadAllPages);