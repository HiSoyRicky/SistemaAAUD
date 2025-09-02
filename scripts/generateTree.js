// Notas/generateTree.js

// npm run tree

const fs = require("fs");
const path = require("path");
const dirTree = require("directory-tree");

const ignore = [/node_modules/, /\.git/, /\.vscode/, /dist/, /build/, /fotos_personal/];

const tree = dirTree(".", { exclude: ignore });

function printTree(node, prefix = "") {
    let output = `${prefix}${node.name}\n`;
    if (node.children) {
        node.children.forEach((child, index) => {
            const isLast = index === node.children.length - 1;
            const newPrefix = prefix + (isLast ? "    " : "│   ");
            output += prefix + (isLast ? "└── " : "├── ") + printTree(child, newPrefix);
        });
    }
    return output;
}

const treeText = printTree(tree);

fs.writeFileSync("docs/estructura.txt", treeText);

console.log("✅ Archivo estructura.txt generado con éxito.");
