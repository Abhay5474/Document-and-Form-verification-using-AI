document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('verificationForm');
    const summaryList = document.getElementById('summaryDocsList');
    const modal = document.getElementById('successModal');

    // Fetch data from the session and populate the form
    try {
        const response = await fetch('/get-session-data');
        const result = await response.json();
        
        if (result.success && result.data) {
            const allData = result.data;
            const collectedData = {};

            // Populate summary and consolidate data
            for (const docType in allData) {
                const listItem = document.createElement('li');
                listItem.textContent = `✅ ${docType.replace(/_/g, ' ')}`;
                summaryList.appendChild(listItem);
                
                // Merge data, giving preference to later uploads for shared fields
                Object.assign(collectedData, allData[docType]);
            }
            
            // Pre-fill the form fields. Use '' as a fallback for empty fields.
            document.getElementById('name').value = collectedData.name || '';
            document.getElementById('fatherName').value = collectedData.fatherName || '';
            document.getElementById('motherName').value = collectedData.motherName || '';
            document.getElementById('dob').value = collectedData.dob || '';
            document.getElementById('gender').value = collectedData.gender || '';
            document.getElementById('address').value = collectedData.address || '';
            
            document.getElementById('aadharNumber').value = collectedData.aadharNumber || '';
            document.getElementById('panNumber').value = collectedData.panNumber || '';
            document.getElementById('casteName').value = collectedData.casteName || '';

            document.getElementById('seatNo').value = collectedData.seatNo || '';
            document.getElementById('boardName').value = collectedData.boardName || '';
            document.getElementById('percentage').value = collectedData.percentage || '';

            document.getElementById('district').value = collectedData.district || '';
            document.getElementById('state').value = collectedData.state || collectedData.territory || '';
            document.getElementById('serialNo').value = collectedData.serialNo || '';
            document.getElementById('issueDate').value = collectedData.issueDate || '';

        } else {
            document.querySelector('.container').innerHTML = '<h1>Error</h1><p>No document data found. Please <a href="/">start over</a>.</p>';
        }

    } catch (error) {
        console.error('Failed to load session data:', error);
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/submit-form', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                modal.classList.add('visible');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                alert('Submission failed. Please try again.');
            }
        } catch (error) {
            alert('An error occurred during submission.');
        }
    });
});