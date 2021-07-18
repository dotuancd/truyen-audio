import { readFileSync } from "fs";

export class Copyright
{
    copyright: string;

    constructor(copyright: string) {
        this.copyright = copyright;
    }

    addTo(content: string): string {   
        let parts = content.split("\n");
   
        let baseParts = 5;
   
        let position = Math.floor(Math.random() * baseParts) * Math.floor(parts.length / baseParts);
   
        return [...parts.slice(0, position), this.copyright, ...parts.slice(position)].join("\n");
    }

    static loadFromFile(path: string) {
        return new Copyright(readFileSync(path).toString("utf8"));
    }
}