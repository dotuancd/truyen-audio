import { AudioConfig, PushAudioOutputStreamCallback, SpeechConfig, SpeechSynthesizer } from "microsoft-cognitiveservices-speech-sdk";
import { Ssml, Voice } from "../ssml";
import { ChunkTts, LimitedByVoiceNodes, WavProcessor } from "../tts";

const HoaiMy: Voice = {
    code: "vi-VN-HoaiMyNeural"
}

const NamMinh: Voice = {
    code: "vi-VN-NamMinhNeural"
}

const An: Voice = {
    code: "vi-VN-An"
}

export const MsVoices = {
    HoaiMy,
    NamMinh,
    An,
} as const;

class NullAudioOutputStream extends PushAudioOutputStreamCallback {
    write(dataBuffer: ArrayBuffer): void {   
    }

    close(): void {
    }
}

export class MsTts extends ChunkTts implements LimitedByVoiceNodes {

    static factory(subscriptionKey: string, region: string) {
        return new MsTts(SpeechConfig.fromSubscription(subscriptionKey, region));
    }

    speechConfig: SpeechConfig;

    maxVoiceNodesAllowed: number = 50;

    readonly CHUNK_SIZE: number = 8000;

    constructor(speechConfig: SpeechConfig) {
        super(new WavProcessor);
        this.speechConfig = speechConfig;
    }

    protected async sendRequest(ssml: Ssml): Promise<Buffer> {
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
                    resolve(Buffer.from(result.audioData));
                },
                error => {
                    synthesizer.close();
                    reject(error);
                });
        });
    }
}