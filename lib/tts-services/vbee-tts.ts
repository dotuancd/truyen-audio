import axios from "axios";
import { timeStamp } from "console";
import { createWriteStream, fstat, writeFileSync } from "fs";
import { Agent } from "http";
// import { Agent } from "https";
import HttpsProxyAgent from "https-proxy-agent";
import { OCSPCacheFetchErrorEvent } from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common/OCSPEvents";
import { sequential } from "../async";
import { Proxy, ProxyRotation } from "../proxy_rotation";
import { Ssml, Voice, VoiceNode } from "../ssml";
import { AudioProcessor, ChunkTts, Mp3Processor, TtsService } from "../tts";
import * as tunnel from 'tunnel'
import { Str } from "../str";
import { findSourceMap } from "module";
import { NoSsmlDecorator, NoSsmlTts } from "./no-ssml-decorator";

export const HnNgocHuyen: Voice = {
    code: "hn_female_ngochuyen_news_48k-thg"
}

export const HueHuongGiang: Voice = {
    code: "hue_female_huonggiang_news_48k-thg"
}

export const SgMinhHoang: Voice = {
    code: "sg_male_minhhoang_news_48k-thg"
}

export const HnThuTrang: Voice = {
    code: "hn_female_thutrang_phrase_48k-hsmm"
}

export const HnManhDung: Voice = {
    code: "hn_male_xuantin_vdts_48k-hsmm"
}

export const HnManhDungDocBao: Voice = {
    code: 'hn_male_manhdung_news_48k-d'
}

// export const SgMinhHoang: Voice = {
//     name: "sg_male_minhhoang_news_48k-thg"
// }

// export const SgMinhHoang: Voice = {
//     name: "sg_male_minhhoang_news_48k-thg"
// }

// export const SgMinhHoang: Voice = {
//     name: "sg_male_minhhoang_news_48k-thg"
// }

// export const SgMinhHoang: Voice = {
//     name: "sg_male_minhhoang_news_48k-thg"
// }
    // case "sg_female_thaotrinh_dialog_48k-hsmm":
    //     t = "SG Nữ Thảo Trinh Hội Thoại";
    //     break;
    // case "hn_female_maiphuong_news_48k-d":
    //     t = "HN Mai Phương Đọc Báo Nâng Cao";
    //     break;
    // case "hn_female_ngochuyen_news_48k-d":
    //     t = "HN Ngọc Huyền Đọc Báo Nâng Cao";
    //     break;
    // case "vbee-tts-voice-hn_female_ngochuyen_news_48k-h":
    //     t = "HN Ngọc Huyền Đọc Báo";
    //     break;
    // case "hn_male_manhdung_news_48k-d":
    //     t = "HN Mạnh Dũng Đọc Báo Nâng Cao";
    //     break;
    // case "sg_female_thaotrinh_news_48k-d":
    //     t = "SG Thảo Trinh Đọc Báo Nâng Cao";
    //     break;
    // case "sg_male_minhhoang_news_48k-d":
    //     t = "SG Minh Hoàng Đọc Báo Nâng Cao";
    //     break;
    // case "sg_male_minhhoang_dial_48k-hsmm":
    //     t = "SG Nam Minh Hoàng Hội Thoại";
    //     break;
    // case "vbee-tts-voice-hn_female_maiphuong_news_48k-h":
    //     t = "HN Nữ Mai Phương Đọc Báo";
    //     break;
    // case "vbee-tts-voice-sg_female_thaotrinh_news_48k-h":
    //     t = "SG Nữ Thảo Trinh Đọc Báo";
    //     break;
    // case "hue_male_duyphuong_news_48k-d":
    //     t = "Huế Duy Phương Nâng Cao";
    //     break;
    // case "hue_female_huonggiang_news_48k-d":
    //     t = "Huế Hương Giang Nâng Cao";
    //     break;
    // default:
    //     t = "Nam Mạnh Dũng Đọc Báo"
    // }
    // return t
// }


export class VbeeTts extends ChunkTts implements NoSsmlTts {


    readonly baseUrl: string = "https://vbee.vn/api/v1/convert-tts";
    // readonly baseUrl: string = "https://api.ipify.org/?format=json"

    readonly CHUNK_SIZE: number = 3000;

    readonly maxTried = 3;

    proxies: ProxyRotation;
    

    constructor(proxies: ProxyRotation) {
        super(new Mp3Processor);

        this.proxies = proxies;
    }

    private createHttpsAgent(proxy: Proxy | false) {
        if (proxy) {
            let httpsAgent = tunnel.httpsOverHttp({
                proxy: {
                    host: proxy.host,
                    port: proxy.port,
                    proxyAuth: `${proxy.auth.username}:${proxy.auth.password}`
                },
            });

            return {httpsAgent};
        }

        return {};
    }

    async createAudioForVoice(voice: VoiceNode, tried = 0) {

        let proxy = this.proxies.rotate();

        try {
            console.log(`[INFO] Request using proxy ${proxy.host}`);
            console.log({content: voice.content});

            let response = await axios.get(this.baseUrl, {
                params: {"input_text": voice.content, "bit_rate": "128000", "voice": voice.voice.code},
                ...this.createHttpsAgent(proxy)
            });

            if (this.isBlocked(response.data) && proxy) {
                console.log(`[WARN] Blocked IP: ${proxy.host}`);
                this.proxies.revoke(proxy);
            }

            console.log({
                headers: response.headers,
                body: response.data,
            });

            let audio = await axios.get(response.data.download, {responseType: "arraybuffer"});

            return Buffer.from(audio.data);
        } catch (e) {
            console.log(`[ERROR] ${e.message}: ${tried}`);
            console.error(e);

            if (this.shouldRetry(e, tried)) {
                console.log(`[INFO] Retrying`);
                return this.createAudioForVoice(voice, tried + 1);
            }
        }
    }

    private isBlocked(response: any) {
        return response.status_code === 1
    }

    private shouldRetry(e: any, tried: number): boolean {
        if (e.body) {
            return this.isBlocked(e);
        }

        return tried <= this.maxTried;
    }

    protected async sendRequest(content: Ssml): Promise<Buffer> {
        let service = new NoSsmlDecorator(this, this.audioProcessor);
        return await service.speakSsml(content);
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        throw new Error("Method not implemented.");
    }

}