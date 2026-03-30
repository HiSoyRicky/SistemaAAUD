// npm run tree

const fs = require("fs");
const path = require("path");

const ignore = [/node_modules/, /\.git/, /\.vscode/, /dist/, /build/, /fotos_personal/];
const MAX_DEPTH = 6;

function shouldIgnore(name) {
    return ignore.some((pattern) => pattern.test(name));
}

function generateTree(dir, prefix = "", isLast = true, depth = 0) {
    if (depth > MAX_DEPTH) return "";

    const basename = path.basename(dir);
    if (shouldIgnore(basename)) return "";

    const connector = prefix ? (isLast ? "└── " : "├── ") : "";
    let tree = prefix + connector + basename + "\n";

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
            .filter(entry => !shouldIgnore(entry.name))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
        return tree + prefix + "    ⚠️ Error leyendo carpeta\n";
    }

    const newPrefix = prefix + (isLast ? "    " : "│   ");

    entries.forEach((entry, index) => {
        const fullPath = path.join(dir, entry.name);
        const isLastEntry = index === entries.length - 1;

        if (entry.isDirectory()) {
            tree += generateTree(fullPath, newPrefix, isLastEntry, depth + 1);
        } else {
            const connector = isLastEntry ? "└── " : "├── ";
            tree += newPrefix + connector + entry.name + "\n";
        }
    });

    return tree;
}

const rootDir = process.cwd();
const output = generateTree(rootDir);

const docsPath = path.join(rootDir, "docs");
if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath);
}

fs.writeFileSync(path.join(docsPath, "tree.txt"), output, "utf8");
console.log("📂 Árbol generado en docs/tree.txt");