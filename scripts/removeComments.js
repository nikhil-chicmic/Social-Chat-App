const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const SRC_DIR = path.join(__dirname, "..", "src");

const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);

function getScriptKind(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".ts":
      return ts.ScriptKind.TS;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function stripCommentsInFile(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
  });

  const result = printer.printFile(sourceFile);
  fs.writeFileSync(filePath, result, "utf8");
  console.log(`Stripped comments from: ${path.relative(SRC_DIR, filePath)}`);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && exts.has(path.extname(entry.name))) {
      stripCommentsInFile(fullPath);
    }
  }
}

if (fs.existsSync(SRC_DIR)) {
  walk(SRC_DIR);
} else {
  console.error(`SRC directory not found at ${SRC_DIR}`);
  process.exit(1);
}

