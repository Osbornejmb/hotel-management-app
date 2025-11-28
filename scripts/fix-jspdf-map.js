const fs = require('fs');
const path = require('path');

const minimalMap = {
  version: 3,
  file: 'jspdf.es.min.js',
  sources: [],
  names: [],
  mappings: ''
};

// possible locations to check
const candidates = [
  path.join(__dirname, '..', 'frontend', 'node_modules', 'jspdf', 'dist', 'jspdf.es.min.js.map'),
  path.join(__dirname, '..', 'node_modules', 'jspdf', 'dist', 'jspdf.es.min.js.map'),
  path.join(__dirname, '..', '..', 'node_modules', 'jspdf', 'dist', 'jspdf.es.min.js.map')
];

let found = false;
for (const c of candidates) {
  try {
    const dir = path.dirname(c);
    if (!fs.existsSync(dir)) continue;
    // If file exists, validate JSON; if invalid or missing, overwrite with minimalMap
    let writeIt = true;
    if (fs.existsSync(c)) {
      try {
        const content = fs.readFileSync(c, 'utf8');
        JSON.parse(content);
        console.log('Map file is valid JSON:', c);
        writeIt = false;
      } catch (err) {
        writeIt = true;
      }
    }
    if (writeIt) {
      fs.writeFileSync(c, JSON.stringify(minimalMap), 'utf8');
      console.log('Wrote minimal jspdf source map at:', c);
    }
    found = true;
  } catch (err) {
    console.error('Error processing map candidate:', c, err && err.message);
  }
}

if (!found) {
  console.log('No jspdf.es.min.js.map target directories found.');
}
