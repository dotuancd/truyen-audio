import { Str } from "./str";

export class Voice {
    content: string;
    voice: string;

    get length() {
        return this.content.length;
    }

    constructor(voice: string, content: string) {
        this.voice = voice;
        this.content = content;
    }

    toString() {
        return `<voice name="${this.voice}">${this.content}</voice>`;
    }

    chunk(size: number): Voice[] {
        if (this.length <= size) {
            return [new Voice(this.voice, this.content)];
        }

        return Str.chunk(this.content, size).map(chunk => new Voice(this.voice, chunk))
    }
}

export class Ssml {
    voices: Voice[] = [];

    get length() {
        return this.voices.map(voice => voice.length).reduce((sum, size) => sum + size, 0);
    }

    voice(voice: Voice) {
        this.voices.push(voice);
    }

    chunk(size: number): Ssml[] {

        let voices = this.voices.flatMap(voice => voice.chunk(size));
        console.log({before: this.voices.length, after: voices.length});

        let chunks = [new Ssml];
        voices.forEach((voice) => {
            let last = chunks[chunks.length - 1];
            if (last.length + voice.length <= size) {
                last.voice(voice);
            } else {
                last = new Ssml;
                last.voice(voice);
                chunks.push(last);
            }
        })

        return chunks;
    }

    toString() {
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">${this.voices.join("\n")}</speak>`
    }
}