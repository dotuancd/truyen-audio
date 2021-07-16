import { writeFileSync } from "fs";
import path from "path/posix";
import { Chapter } from "./download";

export class Storage {
    prefix?: string;
    dir: string;
    constructor(outputDir: string, prefix?: string) {
        this.dir = outputDir;
        this.prefix = prefix;
    }

    resolve(chapter: Chapter): string {
        return path.join(this.dir, `${this.prefix}${chapter}.wav`);
    }

    save(chapter: Chapter, data: Buffer): string {
        let target = this.resolve(chapter);
        writeFileSync(target, data);

        return target;
    }
}