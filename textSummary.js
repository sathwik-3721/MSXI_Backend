const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Replace with your actual API key
const API_KEY = "AIzaSyCn6QoGARxGXBHq6dYGWY90OzsRaQAChps";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY);

// Path to your text file
const textFilePath = "pdf_metadata.txt";

async function analyzeText() {
  // Read the text file
  const fileContent = fs.readFileSync(textFilePath, 'utf8');
  
  // Initialize the model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze the following text and provide a summary and comprehension in JSON format. 
  Include the following keys:
  - summary: A brief summary of the text content
  - mainTopics: An array of main topics or themes discussed
  - keyPoints: An array of key points or arguments made
  - tone: The overall tone of the text
  - additionalInsights: Any other relevant observations or analyses

  Here's the text to analyze:
  ${fileContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = JSON.parse(response.text());
    console.log(JSON.stringify(jsonResponse, null, 2));
    return jsonResponse;
  } catch (error) {
    console.error("Error analyzing text:", error);
    return null;
  }
}

analyzeText();