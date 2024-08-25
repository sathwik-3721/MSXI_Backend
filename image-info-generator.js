const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Replace with your actual API key
const API_KEY = "AIzaSyCn6QoGARxGXBHq6dYGWY90OzsRaQAChps";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY);

// Path to your image file
const imagePath = "demoImg.jpg";

async function fileToGenerativePart(path, mimeType) {
  const data = fs.readFileSync(path);
  return {
    inlineData: {
      data: Buffer.from(data).toString("base64"),
      mimeType
    }
  };
}

async function analyzeImage() {
  // Load the image file
  const imagePart = await fileToGenerativePart(imagePath, "image/jpeg");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Describe this image in detail.";

  const result = await model.generateContent([
    prompt,
    imagePart
  ]);
  const response = await result.response;
  console.log(response.text());
}

analyzeImage();