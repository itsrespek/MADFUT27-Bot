import fs from "fs";
import path from "path";

const cFile = path.resolve(process.cwd(), "data");

if (!fs.existsSync(cFile)) {
    fs.mkdirSync(cFile, { recursive: true });
}

export function readCacheNumber(fName: string, dVal: number = 0): number {
    try {
        const content = fs.readFileSync(path.join(cFile, fName), "utf-8"), parsed = JSON.parse(content);
        return typeof parsed.value === "number" ? parsed.value : dVal;
    } 
    catch {
        return dVal;
    }
}

export function writeCacheNumber(fName: string, value: number): void {
    fs.writeFileSync(path.join(cFile, fName), JSON.stringify({ value }), "utf-8");
}