import { Str } from "./str";

export interface Voice {
    code: string
}

export class VoiceNode {
    content: string;
    voice: Voice;
    speed: number;

    get length() {
        return this.content.length;
    }

    constructor(voice: Voice, content: string, speed: number = 1) {
        this.voice = voice;
        this.content = content;
        this.speed = speed;
    }

    toString() {
        return `<voice name="${this.voice.code}"><prosody rate="${this.speed}">${this.content}</prosody></voice>`;
    }

    chunk(size: number): VoiceNode[] {
        if (this.length <= size) {
            return [new VoiceNode(this.voice, this.content, this.speed)];
        }

        return Str.chunk(this.content, size).map(chunk => new VoiceNode(this.voice, chunk, this.speed))
    }
}

export const NoLimitVoiceNodes = -1;

export class Ssml {
    voices: VoiceNode[];
    lang: string = 'vi-VN';

    constructor(...voices: VoiceNode[]) {
        this.lang = this.lang;
        this.voices = voices;
    }

    get length() {
        return this.voices.map(voice => voice.length).reduce((sum, size) => sum + size, 0);
    }

    voice(voice: VoiceNode) {
        this.voices.push(voice);
    }

    chunk(size: number, maxVoiceNodes = NoLimitVoiceNodes): Ssml[] {
        // Chunk voice if needs
        let voices = this.voices.flatMap(voice => voice.chunk(size));
        
        let chunks = [new Ssml()];
        voices.forEach((voice) => {
            let last = chunks[chunks.length - 1];

            if (maxVoiceNodes !== NoLimitVoiceNodes && last.voices.length == maxVoiceNodes) {
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