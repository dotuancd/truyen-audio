import { timeStamp } from "console";
import { writeFileSync } from "fs";
import { AudioConfig, PushAudioOutputStreamCallback, SpeechConfig, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";
import { Str } from "./str";
import { Wav } from "./wav";

export enum Voice {
    HoaiMy = "vi-VN-HoaiMyNeural",
    NamMinh = "vi-VN-NamMinhNeural"
}

class Ssml {
    voices: string[];
    
    voice(content: string, voice: Voice) {
        this.voices.push(`<voice name="${voice}">${content}</voice>`);
    }

    toString() {
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">${this.voices.join("")}</speak>`;
    }
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

    constructor(speechConfig: SpeechConfig) {
        this.speechConfig = speechConfig;
    }

    async withAudioConfig(content: string, voice: Voice, audioConfig: AudioConfig): Promise<Buffer> {
        const synthesizer = new SpeechSynthesizer(this.speechConfig, audioConfig);

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">
    <voice name="${voice}">
        <prosody pitch="-5.00%">
        ${content}
        </prosody>
    </voice>
    </speak>`;

        return new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(
                ssml,
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

    async speak(content: string, voice: Voice) {
        const stream = new NullAudioOutputStream();

        const audioConfig = AudioConfig.fromStreamOutput(stream);
        return this.withAudioConfig(content, voice, audioConfig);
    }

    async speakConcat(content: string, voice: Voice, chunkSize = 8000) {
        let sessions = Str.chunk(content, chunkSize).map(speech => {
            console.log(`[INFO] Converting ${speech.length} characters.`);
            return this.speak(speech, voice)
        });

        let parts = await Promise.all(sessions);
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