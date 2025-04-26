import fs from "fs";
import path from "path";

interface Registry {
  items: Record<string, any>[];
  [key: string]: string | Record<string, any>[];
}

interface FileStats {
  isFile: () => boolean;
  isDirectory: () => boolean;
}

function walkSync(dir: string, callback: (filePath: string, stats: FileStats) => void) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walkSync(filePath, callback);
    } else if (stats.isFile()) {
      callback(filePath, stats);
    }
  });
}

const registryPath = path.join(__dirname, "registry.json");
let registry: Registry;

try {
  registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
} catch (error) {
  console.error("Error reading registry.json:", error);
  registry = { items: [] };
}

const discoveryFolder = path.join(__dirname, "src/registry");
const files = new Set<string>();

// Walk to find any JSON files
walkSync(discoveryFolder, (filePath, stats) => {
  if (stats.isFile() && filePath.endsWith(".json")) {
    files.add(filePath);
  }
});

// Set the files contents to the registry items array as JSON
registry.items = [];

files.forEach(filePath => {
  try {
    const contents = fs.readFileSync(filePath, "utf8");
    registry.items.push(JSON.parse(contents));
  } catch (error) {
    console.error(`Error reading or parsing file ${filePath}:`, error);
  }
});

try {
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
} catch (error) {
  console.error("Error writing to registry.json:", error);
}


