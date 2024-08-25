const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const ExifReader = require('exifreader');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json()); // To parse JSON bodies

const apiKey = "AIzaSyCn6QoGARxGXBHq6dYGWY90OzsRaQAChps"

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(apiKey);

async function analyzeText(fileContent) {
  console.log("File Content:", fileContent);

  // Initialize the model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze the following text and extract the following information in JSON format:
  - customerName: The full name of the customer
  - vehicleInfo: Details about the vehicle involved
  - customerEmail: The email address of the customer
  - claimStatus: The current status of the claim (e.g., approved, rejected, pending)
  - rejectionReason: If the claim is rejected, provide the reason; otherwise, set this to null

  Here's the text to analyze:
  ${fileContent}`;

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
    console.error("Error analyzing text:", error);
    return null;
  }
}

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

app.post('/claim-info', async (req, res) => {
  try {
    // Extract the text from the request body
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided in request body" });
    }

    const claimInfo = await analyzeText(text);
    console.log("Claim-info", claimInfo);

    if (claimInfo) {
      res.json(claimInfo);
    } else {
      res.status(500).json({ error: "Failed to analyze claim information" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bind to all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://192.168.31.157:${PORT}`);
});
