import axios from "axios";
import { Logger } from "../logger";
import { Ssml, Voice, VoiceNode } from "../ssml";
import { ChunkTts, Mp3Processor, WavProcessor } from "../tts";
import { NoSsmlDecorator, NoSsmlTts } from "./no-ssml-decorator";
import * as qs from 'querystring';

export const NuSG: Voice = {code: "1"};
export const NuHN: Voice = {code: "2"};
export const NamSG: Voice = {code: "3"};
export const NamHN: Voice = {code: "4"};

export class ZaloTts extends ChunkTts implements NoSsmlTts {

    readonly CHUNK_SIZE: number = 2000;

    ENCODE_WAV = "0";

    ENCODE_MP3 = "1";

    ENCODE_AAC = "2";

    baseUrl: string = "https://api.zalo.ai/v1/tts/synthesize";

    protected apiKey: string;

    constructor(apiKey: string) {
        super(new Mp3Processor);

        this.apiKey = apiKey;
    }
    
    protected async sendRequest(content: Ssml): Promise<Buffer> {
        let service = new NoSsmlDecorator(this, this.audioProcessor);

        return await service.speakSsml(content);
    }

    private delay(ms: number) {
        return new Promise((resolve: (value: unknown) => void) => {
            setTimeout(resolve, ms, true);
        });
    }

    async createAudioForVoice(node: VoiceNode): Promise<Buffer> {
        let content = node.content
            .replace(/\r/g, "")
            .replace(/\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        let data = qs.stringify({
            input: content,
            encode_type: this.ENCODE_MP3,
            speaker_id: node.voice.code
        });

        console.log({content});

        let res = await axios.post(this.baseUrl, data, {headers: {"apikey": this.apiKey, "Content-Type": "application/x-www-form-urlencoded"}});

        Logger.info({response: res.data})

        await this.delay(3_000);

        let url = res.data.data.url;

        return await axios.get(url, {responseType: "arraybuffer"});
    }
}
