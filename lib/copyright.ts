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

    placement(replacements: object) {
        let content = Object.keys(replacements).reduce((content, search) => {
            return content.replaceAll('{' + search + '}', replacements[search]);
        }, this.copyright);

        return new Copyright(content);
    }

    addAsOutroOf(content: string): string {
        return `${content}.

${this.copyright}`;
    }

    static loadFromFile(path: string) {
        return new Copyright(readFileSync(path).toString("utf8"));
    }
}