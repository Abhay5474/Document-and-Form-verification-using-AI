// Import necessary packages
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const session = require('express-session');
require('dotenv').config();

// --- Configuration ---
const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// --- Session Middleware Setup ---
if (!SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined in .env file.");
    process.exit(1);
}
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        httpOnly: true, 
        maxAge: 60 * 60 * 1000 
    }
}));

// --- Serve Frontend Files ---
app.use(express.static('public')); 
app.get('/form.html', (req, res) => {
    res.sendFile(__dirname + '/public/form.html');
});

// === UPDATED PROMPT GENERATION LOGIC ===
function getPromptForDocType(docType) {
    const basePrompt = "You are an expert data extraction AI. Analyze this image of a government document. " +
                       "Return the data ONLY in a valid JSON object format. Do not include any other text or markdown formatting. " +
                       "If a field is not found, use an empty string '' as the value. Extract the following fields with these exact JSON keys: ";
    
    let fields = '';
    switch (docType) {
        case 'aadhar':
            fields = "full name as 'name', aadhar number as 'aadharNumber', gender as 'gender', address as 'address', and date of birth as 'dob'.";
            break;
        case 'pan':
            fields = "full name as 'name', father's name as 'fatherName', Permanent Account Number (PAN) as 'panNumber', and date of birth as 'dob'.";
            break;
        case 'marksheet_10th':
            fields = "student's name as 'name', seat number as 'seatNo', mother's name as 'motherName', divisional board name as 'boardName', and percentage as 'percentage'.";
            break;
        case 'caste_certificate':
            fields = "caste name as 'casteName'.";
            break;
        case 'domicile_certificate':
            fields = "district name as 'district', serial number as 'serialNo', issue date as 'issueDate', state as 'state', and territory as 'territory'.";
            break;
        default:
            fields = "any visible name as 'name', numbers, and dates.";
    }
    return basePrompt + fields;
}
// ==========================================

// --- API Endpoint 1: Analyze Document and Save to Session ---
app.post('/analyze-document', upload.single('document'), async (req, res) => {
    const docType = req.body.docType;
    if (!req.file || !docType) {
        return res.status(400).json({ error: 'File or document type missing.' });
    }

    if (!req.session.documentData) {
        req.session.documentData = {};
    }

    try {
        const imageBase64 = req.file.buffer.toString('base64');
        const prompt = getPromptForDocType(docType);
        
        const requestData = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: req.file.mimetype, data: imageBase64 } }] }] };
        const apiResponse = await axios.post(API_URL, requestData);
        
        const responseText = apiResponse.data.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonData = JSON.parse(cleanedText);

        req.session.documentData[docType] = jsonData;
        
        res.json({ success: true, message: `${docType.replace(/_/g, ' ')} uploaded successfully.`, extractedData: jsonData });

    } catch (error) {
        console.error("Error in /analyze-document:", error.message);
        res.status(500).json({ error: 'Failed to analyze the document.' });
    }
});

// --- API Endpoint 2: Get All Session Data for the Form ---
app.get('/get-session-data', (req, res) => {
    if (req.session.documentData) {
        res.json({ success: true, data: req.session.documentData });
    } else {
        res.json({ success: false, message: 'No document data found in session.' });
    }
});

// --- API Endpoint 3: Submit Form and Destroy Session ---
app.post('/submit-form', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Form submitted and session destroyed.' });
    });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});