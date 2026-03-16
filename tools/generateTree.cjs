// Notas/generateTree.js

// npm run tree

const fs = require("fs");
const path = require("path");

// Carpetas o archivos a ignorar
const ignore = [/node_modules/, /\.git/, /\.vscode/, /dist/, /build/, /fotos_personal/];

function shouldIgnore(name) {
    return ignore.some((pattern) => pattern.test(name));
}

function generateTree(dir, prefix = "", isLast = true) {
    const basename = path.basename(dir);
    if (shouldIgnore(basename)) return "";

    const connector = prefix ? (isLast ? "└── " : "├── ") : "";
    let tree = prefix + connector + basename + "\n";

    const newPrefix = prefix + (isLast ? "    " : "│   ");
    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => !shouldIgnore(entry.name));

    entries.forEach((entry, index) => {
        const fullPath = path.join(dir, entry.name);
        const isLastEntry = index === entries.length - 1;

        if (entry.isDirectory()) {
            tree += generateTree(fullPath, newPrefix, isLastEntry);
        } else {
            const connector = isLastEntry ? "└── " : "├── ";
            tree += newPrefix + connector + entry.name + "\n";
        }
    });

    return tree;
}

// Generar árbol desde la raíz del proyecto
const rootDir = process.cwd();
const output = generateTree(rootDir);

// Crear carpeta docs si no existe
const docsPath = path.join(rootDir, "docs");
if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath);
}

// Guardar resultado
fs.writeFileSync(path.join(docsPath, "tree.txt"), output, "utf8");
console.log("📂 Árbol de directorios generado en docs/tree.txt");