import { timeStamp } from "console";
import { writeFileSync } from "fs";
import { AudioConfig, PushAudioOutputStreamCallback, SpeechConfig, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";
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

export class Tts
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

    async speakSsml(content: Ssml) {
        return this.join(...content.chunk(this.CHUNK_SIZE));
    }

    async speak(content: string, voice: Voice) {
        return this.speakSsml(new Ssml(new SsmlVoice(voice, content)));
    }

    async join(...chunks: Ssml[]) {

        let jobs = chunks.map(async chunk => {
            console.log(`[INFO] Converting ${chunk.length} characters.`);
            return await this._speakSsml(chunk)
        });

        let parts = await Promise.all(jobs);

        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        });

        return audio;
    }

    async saveTo(content: string, voice: Voice, target: string): Promise<string> {

        let sessions = Str.chunk(content, 8000).map(speech => {
            console.log(`[INFO] Converting ${speech.length} characters.`);
            return this.speak(speech, voice)
        });

        let parts = await Promise.all(sessions);

        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        })

        writeFileSync(target, audio);

        return target;
    }
}