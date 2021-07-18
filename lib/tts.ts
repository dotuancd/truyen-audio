import { timeStamp } from "console";
import { writeFileSync } from "fs";
import { AudioConfig, PushAudioOutputStreamCallback, SpeechConfig, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";
import { sequential } from "./async";
import { Ssml, Voice as SsmlVoice } from "./ssml";
import { Str } from "./str";
import { Wav } from "./wav";

export enum Voice {
    HoaiMy = "vi-VN-HoaiMyNeural",
    NamMinh = "vi-VN-NamMinhNeural"
}

class NullAudioOutputStream extends PushAudioOutputStreamCallback
{
    write(dataBuffer: ArrayBuffer): void {   
    }

    close(): void {
    }
}

export interface TtsService {
    speakSsml(content: Ssml): Promise<Buffer>
    speak(content: string, voice: Voice): Promise<Buffer>
}

export class TtsPool implements TtsService {
    readonly CHUNK_SIZE: number = 8000;

    protected pool: TtsService[];

    protected used: number[] = [];

    constructor(...pool: TtsService[]) {
        this.pool = pool;
        this.used = pool.map(_ => 0);
    }

    async speakSsml(content: Ssml): Promise<Buffer> {
        let chunks = content.chunk(this.CHUNK_SIZE);

        let parts = await Promise.all(chunks.map(async (chunk) => {
            return this.resolveService().speakSsml(chunk);
        }));
        
        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        });

        return audio;
    }

    private resolveService(): TtsService {
        let max = this.used.reduce((max, current) => max < current ? current : max);
        let found = this.used.find((usage) => usage < max);
        if (found === undefined) {
            found = 0;
        }

        this.used[found]++;
        return this.pool[found];
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        return this.speakSsml(new Ssml(new SsmlVoice(voice, content)));
    }
}

export class Tts implements TtsService
{
    speechConfig: SpeechConfig;

    readonly CHUNK_SIZE: number = 8000;

    constructor(speechConfig: SpeechConfig) {
        this.speechConfig = speechConfig;
    }

    private async _speakSsml(ssml: Ssml): Promise<Buffer> {
        const stream = new NullAudioOutputStream();
        const audioConfig = AudioConfig.fromStreamOutput(stream);
        const synthesizer = new SpeechSynthesizer(this.speechConfig, audioConfig);

        return new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                ssml.toString(),
                result => {
                    if (result) {
                        console.log(JSON.stringify(result));
                    }

                    synthesizer.close();
                    // let stream = new PassThrough();
                    // stream.end(Buffer.from())
                    resolve(Buffer.from(result.audioData));
                },
                error => {
                    synthesizer.close();
                    reject(error);
                });
        });
    }

    async speakSsml(content: Ssml): Promise<Buffer> {
        return this.join(...content.chunk(this.CHUNK_SIZE));
    }

    async speak(content: string, voice: Voice): Promise<Buffer> {
        return this.speakSsml(new Ssml(new SsmlVoice(voice, content)));
    }

    private async join(...chunks: Ssml[]): Promise<Buffer> {

        // let jobs = chunks.map(async chunk => {
        //     console.log(`[INFO] Converting ${chunk.length} characters.`);
        //     return await this._speakSsml(chunk)
        // });

        let parts = await sequential(chunks, async (chunk) => {
            console.log(`[INFO] Converting ${chunk.length} characters.`);
            return await this._speakSsml(chunk);
        });

        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        });

        return audio;
    }
}