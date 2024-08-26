const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const ExifReader = require('exifreader');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PDFExtract } = require('pdf.js-extract');

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json()); // To parse JSON bodies
app.use(cors());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const apiKey = "GEMINI_API_KEY"; // Make sure to set this in your .env file

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(apiKey);
const pdfExtract = new PDFExtract();
const options = {};

// In-memory store for extracted PDF data
let extractedPdfText = '';

async function analyzeText(fileContent) {
    console.log("File Content (Stringified):", JSON.stringify(fileContent));

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following buffer data, convert it into text and extract the following information in JSON format:
  - customerName: The full name of the customer
  - vehicleInfo: Details about the vehicle involved
  - customerEmail: The email address of the customer
  - claimStatus: The current status of the claim (e.g., approved, rejected, pending)
  - rejectionReason: If the claim is rejected, provide the reason; otherwise, set this to null

  Here's the text to analyze:
  ${JSON.stringify(fileContent)}`;

    console.log("Prompt:", prompt);

    try {
        const result = await model.generateContent(prompt);
        console.log("Result:", result);

        // Retrieve the response text
        const responseText = await result.response.text();
        console.log("Raw Response Text:", responseText);

        // Remove Markdown formatting (```json\n and \n```)
        const cleanedText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');

        console.log("Cleaned Response Text:", cleanedText);

        // Parse the cleaned response text as JSON
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error analyzing text:", error.message);
        return null;
    }
}

// Route for extracting PDF content and analyzing claim info
app.post("/extract-pdf", upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        // Extract content from the uploaded PDF buffer
        pdfExtract.extractBuffer(req.file.buffer, options, async (err, data) => {
            if (err) {
                console.error("Error extracting PDF:", err);
                return res.status(500).send("Error processing PDF.");
            }

            // Save the extracted text (or relevant parts)
            console.log("data", data);
            extractedPdfText = data;
            console.log("Extracted PDF Text:", extractedPdfText);

            // Analyze the extracted PDF text for claim information
            const claimInfo = await analyzeText(extractedPdfText);
            console.log("Claim Info:", claimInfo);

            // Respond with both the extracted PDF data and the analyzed claim info
            return res.json({
                // pdfData: data,
                claimInfo: claimInfo
            });
        });
    } catch (error) {
        console.error("Error processing PDF request:", error.message);
        res.status(500).send("Error processing PDF.");
        throw error;
    }
});

// Route for reading EXIF data from an image file
app.get('/metadata', (req, res) => {
    try {
        // Read the image file as a Buffer
        const buffer = fs.readFileSync('demoImg.jpg');

        // Parse EXIF data from the image buffer using exifreader
        const tags = ExifReader.load(buffer);

        // Send the extracted EXIF data as a JSON response
        res.json(tags);
    } catch (error) {
        console.error('Error reading EXIF data:', error.message);
        res.status(500).send('Error processing image.');
    }
});

// Bind to all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
