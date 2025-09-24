document.addEventListener('DOMContentLoaded', () => {
    const uploader = document.getElementById('documentUploader');
    const uploadButton = document.getElementById('uploadButton');
    const loader = document.getElementById('loader');
    const docTypeSelect = document.getElementById('docTypeSelect');
    const resultContainer = document.getElementById('resultContainer');
    const uploadedDocsList = document.getElementById('uploadedDocsList');
    const proceedButton = document.getElementById('proceedButton');
    const fileNameDisplay = document.getElementById('fileName');

    uploader.addEventListener('change', () => {
        fileNameDisplay.textContent = uploader.files.length > 0 ? uploader.files[0].name : '';
    });

    uploadButton.addEventListener('click', async () => {
        const file = uploader.files[0];
        if (!file) {
            alert('Please select a file first!');
            return;
        }

        const docType = docTypeSelect.value;
        loader.classList.remove('hidden');
        uploadButton.disabled = true;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('docType', docType);

        try {
            const response = await fetch('/analyze-document', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            // Add the uploaded document to our list
            const listItem = document.createElement('li');
            listItem.textContent = `✅ ${result.message}`;
            uploadedDocsList.appendChild(listItem);
            
            // Show the container and proceed button
            resultContainer.classList.remove('hidden');
            proceedButton.classList.remove('hidden');
            
            // Clear file input for next upload
            uploader.value = '';
            fileNameDisplay.textContent = '';
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            loader.classList.add('hidden');
            uploadButton.disabled = false;
        }
    });

    proceedButton.addEventListener('click', () => {
        window.location.href = '/form.html';
    });
});