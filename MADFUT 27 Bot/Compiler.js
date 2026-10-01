import fs from "fs";
import path from "path";

async function loadFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const fName of files) {
        const fPath = path.join(dir, fName);
        if (fs.statSync(fPath).isDirectory()) {
            await loadFiles(fPath);
        } else {
            await import(`./${fPath}`);
        }
    }
}

async function compile() {
    await loadFiles('./JavaScript');
}

compile();