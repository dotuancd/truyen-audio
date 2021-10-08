import axios from "axios";
import { Console } from "console";
import { Logger } from "../logger";
import { Ssml, Voice, VoiceNode } from "../ssml";
import { ChunkTts, WavProcessor } from "../tts";
import { NoSsmlDecorator, NoSsmlTts } from "./no-ssml-decorator";

export const BooksNuHN: Voice = {code: "books.female_north"};
export const NewsNuHN: Voice = {code: "news.female_north"};
export const BooksNuSG: Voice = {code: "books.female_south"};
export const BooksNuHue: Voice = {code: "books.female_central"};
export const NewsNuHue: Voice = {code: "news.female_central"};
export const NewsNuSG: Voice = {code: "news.female_south"};

export const BooksNamSG: Voice = {code: "books.male_south"};
export const NewsNamSG: Voice = {code: "news.male_south"};

// [
//     {
//     model: "tts",
//     region: "vi_lite_female_north",
//     title: "basic.books.female_north",
//     isBasic: !0,
//     enable: !0
// }, {
//     model: "tts",
//     region: "vi_lite_female_central",
//     title: "basic.books.female_central",
//     isBasic: !0,
//     enable: !0
// }, {
//     model: "tts",
//     region: "vi_lite_female_south",
//     title: "basic.books.female_south",
//     isBasic: !0,
//     enable: !0
// }, {
//     model: "tts",
//     region: "vi_lite_male_south",
//     title: "basic.books.male_south",
//     isBasic: !0,
//     enable: !1
// },
// ]

export class Vpnt extends ChunkTts implements NoSsmlTts {

    readonly CHUNK_SIZE: number = 5000;

    readonly SLEEP_FOR_NEXT_CHECK: number = 5;

    baseUrl: string = "https://explorer.idg.vnpt.vn/voice-service/text-to-speech";

    pingUrl: string = "https://explorer.idg.vnpt.vn/voice-service/text-to-speech/check-status"

    protected accessToken: string;
    protected tokenId: string;
    protected tokenKey: string;

    constructor(accessToken: string, tokenId: string, tokenKey: string) {
        super(new WavProcessor);

        this.accessToken = accessToken;
        this.tokenId = tokenId;
        this.tokenKey = tokenKey;
    }
    
    protected async sendRequest(content: Ssml): Promise<Buffer> {
        let service = new NoSsmlDecorator(this, this.audioProcessor);

        return await service.speakSsml(content);
    }

    private sleep(ms: number) {
        return new Promise((resolve: (value: unknown) => void) => {
            setTimeout(resolve, ms, true);
        });
    }

    private sleepInSeconds(seconds: number) {
        return this.sleep(seconds * 1000);
    }

    private async ping(textId: string) {
        return await axios.post(this.pingUrl, JSON.stringify({"text_id": textId}), {headers: this.requestHeaders()})
    }

    private async getDownloadLinks(textId: string): Promise<string[]> {
        Logger.info(`Checking ${textId}`);

        let response = await this.ping(textId);

        if (response.data.object.code === 'success') {
            return response.data.object.playlist.map((text) => text.audio_link);
        }

        Logger.info(`Waiting ${this.SLEEP_FOR_NEXT_CHECK} seconds before next check`);
        await this.sleepInSeconds(this.SLEEP_FOR_NEXT_CHECK);
        return await this.getDownloadLinks(textId);
    }

    private requestHeaders() {
        return {
            "Token-id": this.tokenId,
            "Token-key": this.tokenKey,
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
        }
    }

    async createAudioForVoice(node: VoiceNode): Promise<Buffer> {
        let content = node.content
            .replace(/\r/g, "")
            .replace(/\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        let [model, region] = node.voice.code.split(".");
        let data = JSON.stringify({
            "prosody": 1,
            "text": content,
            "text_split": false,
            model,
            region
        });

        let res = {data: {object: {text_id: ""}}}

        try {
            console.log({body: data});
            res = await axios.post(this.baseUrl, data, {headers: this.requestHeaders()});
        } catch (e) {
            console.log(e.response);
            throw e;
        }

        Logger.info({response: res.data})

        let textId = res.data.object.text_id;

        await this.sleepInSeconds(3);

        let links = await this.getDownloadLinks(textId);

        let chunks = await Promise.all(links.map(async (link) => {
            Logger.info(`Dowloading ${link}`);
            let res = await axios.get(link, {responseType: "arraybuffer"});
            return Buffer.from(res.data)
        }));

        return chunks.reduce((result, current) => {
            return this.audioProcessor.join(result, current);
        })
    }
}
