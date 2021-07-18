import { writeFileSync } from "fs";
import path from "path/posix";
import { Chapter, ChapterInfo } from "./download";


export interface StorageOption {
    text: boolean,
    audio: boolean,
    ssml: boolean,
    dir: string,
    prefix?: string
}

export enum FileType {
    text = "text",
    json = "json",
    audio = "audio",
    ssml = "ssml"
}

export const Extentions: Record<FileType, string> = {
    [FileType.audio]: "wav",
    [FileType.text]: "txt",
    [FileType.ssml]: "ssml.txt",
    [FileType.json]: "json",
}

export interface FilenameResolver {
    resolve(chapter: Chapter, type: FileType): string
}

export const DefaultFilenameResolver: FilenameResolver = {
    resolve(chapter: Chapter, type: FileType) {
        return `${chapter}.${Extentions[type]}`;
    }
}

export class PrefixFilenameResolver implements FilenameResolver {

    filenameResolver: FilenameResolver;
    prefix: string;

    constructor(prefix: string, filenameResolver: FilenameResolver) {
        this.prefix = prefix;
        this.filenameResolver = filenameResolver;
    }

    resolve(chapter: Chapter, type: FileType): string {
        return this.prefix + this.filenameResolver.resolve(chapter, type);
    }
}

export class Storage {
    // prefix?: string;
    // dir: string;

    dir: string;

    protected filenameResolver: FilenameResolver;

    constructor(dir: string, filenameResolver: FilenameResolver = DefaultFilenameResolver) {
        this.dir = dir;
        this.filenameResolver = filenameResolver;
    }

    setFilenameResolver(fn: FilenameResolver) {
        this.filenameResolver = fn;
        return this;
    }

    saveAudio(chapter: Chapter, data: Buffer | string) {
        return this.write(chapter, data, FileType.audio);
    }

    saveText(chapter: Chapter, data: Buffer | string) {
        return this.write(chapter, data, FileType.text);
    }

    saveSsml(chapter: Chapter, data: Buffer | string) {
        return this.write(chapter, data, FileType.ssml);
    }

    saveAsJson(info: ChapterInfo) {
        return this.write(info.chapterNo, JSON.stringify(info, null, 4), FileType.json);
    }

    private write(chapter: Chapter, data: Buffer | string, type: FileType): string {
        let filename = this.filenameResolver.resolve(chapter, type)
        let target = path.join(this.dir, filename);
        writeFileSync(target, data);
        return target;
    }
}