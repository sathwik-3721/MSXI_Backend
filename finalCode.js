const ExifReader = require('exifreader');
const fs = require('fs');

function getImageMetadata(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(`Error reading file: ${err}`);
        return;
      }

      try {
        const tags = ExifReader.load(data);
        resolve(tags);
      } catch (error) {
        reject(`Error extracting metadata: ${error}`);
      }
    });
  });
}

// Usage example
const imagePath = 'demoImg.png';

getImageMetadata(imagePath)
  .then((metadata) => {
    console.log('Image Metadata:');
    console.log(JSON.stringify(metadata, null, 2));
  })
  .catch((error) => {
    console.error(error);
  });