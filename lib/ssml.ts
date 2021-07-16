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
    voices: Voice[];
    lang: string = 'vi-VN';

    constructor(...voices: Voice[]) {
        this.lang = this.lang;
        this.voices = voices;
    }

    get length() {
        return this.voices.map(voice => voice.length).reduce((sum, size) => sum + size, 0);
    }

    voice(voice: Voice) {
        this.voices.push(voice);
    }

    chunk(size: number): Ssml[] {
        // Chunk voice if needs
        let voices = this.voices.flatMap(voice => voice.chunk(size));

        let chunks = [new Ssml()];
        voices.forEach((voice) => {
            let last = chunks[chunks.length - 1];

            if (last.voices.length == 50) {
                last = new Ssml;
                chunks.push(last);
            }

            // Uses last node if it empty to prevent add empty not at beginning in case first voice has size > chunk size.
            if (last.length == 0 || last.length + voice.length <= size) {
                last.voice(voice);
            } else {
                chunks.push(new Ssml(voice));
            }
        })

        return chunks;
    }

    toString() {
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${this.lang}">
        ${this.voices.join("\n")}
        </speak>`
    }
}