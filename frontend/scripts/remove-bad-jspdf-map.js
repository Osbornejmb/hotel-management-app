const fs = require('fs');
const path = require('path');

// Small valid source map template to avoid parsing errors
const minimalMap = {
  version: 3,
  file: 'jspdf.es.min.js',
  sources: [],
  names: [],
  mappings: ''
};

// Path relative to project root where node_modules will typically live
const candidatePaths = [
  path.join(__dirname, '..', 'node_modules', 'jspdf', 'dist', 'jspdf.es.min.js.map'),
  path.join(__dirname, '..', '..', 'node_modules', 'jspdf', 'dist', 'jspdf.es.min.js.map')
];

let written = false;
for (const mapPath of candidatePaths) {
  try {
    const dir = path.dirname(mapPath);
    if (!fs.existsSync(dir)) continue;
    fs.writeFileSync(mapPath, JSON.stringify(minimalMap), 'utf8');
    console.log('Wrote minimal jspdf source map at:', mapPath);
    written = true;
  } catch (err) {
    // non-fatal
    console.error('Error writing jspdf source map at', mapPath, err && err.message);
  }
}

if (!written) {
  console.log('No jspdf map target directories found; nothing written.');
}
