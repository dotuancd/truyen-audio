import { v1beta1 } from "@google-cloud/text-to-speech";
import { Ssml, Voice } from "../ssml";
import { ChunkTts, WavProcessor } from "../tts";

const StandardA: Voice = {
    code: "vi-VN-Standard-A"
}

const StandardD: Voice = {
    code: "vi-VN-Standard-D"
}

const WavenetA: Voice = {
    code: "vi-VN-Wavenet-A"
}

const WavenetD: Voice = {
    code: "vi-VN-Wavenet-D"
}

export const GVoices = {
    StandardA,
    StandardD,
    WavenetA,
    WavenetD,
} as const;

type TextToSpeechClient = v1beta1.TextToSpeechClient

export class GoogleTts extends ChunkTts {

    client: TextToSpeechClient;

    readonly CHUNK_SIZE: number = 4000;

    constructor(client: TextToSpeechClient) {
        super(new WavProcessor);
        this.client = client;
    }

    protected async sendRequest(content: Ssml): Promise<Buffer> {
        let [response] = await this.client.synthesizeSpeech({
            input: {
                ssml: content.toString()
            },
            voice: {languageCode: "vi-VN"},
            audioConfig: {
                audioEncoding: "LINEAR16"
            }
        });
        
        return Buffer.from(response.audioContent);
    }

    static factory(): GoogleTts {
        return new GoogleTts(
            new v1beta1.TextToSpeechClient
        );
    }
}
