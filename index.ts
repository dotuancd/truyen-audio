import * as dotenv from 'dotenv'
import { Downloader, TruyenFull } from './lib/download';
import { Copyright } from './lib/copyright';
import { Logger } from './lib/logger';
import { TtsPool} from './lib/tts';
import { ExtensionsFilenameResolver, FileType, PrefixFilenameResolver, Storage } from './lib/storage';
import { Autoturn } from './lib/auto_turn';
import { GoogleTts, GVoices } from './lib/tts-services/gg-tts';
import { MsTts, MsVoices } from './lib/tts-services/ms-tts';
import { HnManhDungDocBao, HnNgocHuyen, VbeeTts } from './lib/tts-services/vbee-tts';
import { RandomProxyRotation } from './lib/proxy_rotation';
import { BuyProxies } from './lib/proxy-services/buyproxies';
import { NamHN, NuHN, ZaloTts } from './lib/tts-services/zalo';
import { Vpnt, BooksNamSG, BooksNuSG } from './lib/tts-services/vnpt';

const config = dotenv.config().parsed;

(async () => {

    // let buyProxies = new BuyProxies(config.BUY_PROXIES_PID, config.BUY_PROXIES_KEY);
    // let proxies = await buyProxies.proxies();
    // let tts = MsTts.factory(config.MS_TTS_KEY, config.MS_TTS_REGION);
    let tts = new Vpnt(config.VPNT_ACCESS_TOKEN, config.VPNT_TOKEN_ID, config.VPNT_TOKEN_KEY)
    // let tts = new VbeeTts(new RandomProxyRotation(proxies));
    // let tts = new ZaloTts(config.ZALO_KEY);

    // let tts = new TtsPool(
    //     GoogleTts.factory(),
    //     GoogleTts.factory(),
    //     GoogleTts.factory(),
    //     GoogleTts.factory(),
    //     GoogleTts.factory()
    // );
    // let tts = GoogleTts.factory();
    // const downloader: Downloader = new TruyenFull('https://truyenfull.vn/the-gioi-hoan-my');
    const downloader: Downloader = new TruyenFull('https://truyenfull.vn/dau-la-dai-luc-230420');
    const copyright = Copyright.loadFromFile('copyright.txt');
    const autoturn = new Autoturn(BooksNamSG, BooksNuSG);
    // const autoturn = new Autoturn(HnNgocHuyen, HnManhDungDocBao);
    // const autoturner = new Autoturn(GVoices.WavenetA, GVoices.WavenetD);
    const outro = Copyright.loadFromFile('outro.txt');

    let filenameResolver = new PrefixFilenameResolver(
        "dldl-chuong-",
        ExtensionsFilenameResolver.default(tts.audioProcessor)
    );
        
    const storage = new Storage("output/dau-la-dai-luc", filenameResolver);

    const processChapter = async (chapter: number, condition: (chapter: number) => boolean) => {
        Logger.info(`Downloading chapter ${chapter}`);

        // Download content
        let chapterInfo = await downloader.download(chapter);

        // Adding copy right
        let content = copyright.addTo(chapterInfo.content);
        // Replace variable for outro
        content = outro.placement({"chapter": chapterInfo.chapterTitle, "novel_title": chapterInfo.novelTitle}).addAsOutroOf(content);

        // Run text to speech & save it to output directory
        Logger.info(`Converting text to speech - Chapter ${chapter}`);
        let ssml = autoturn.makeup(content);
        storage.saveSsml(chapter, ssml.toString());
        storage.saveText(chapter, content);
        storage.saveAsJson(chapterInfo);

        let audio = await tts.speakSsml(ssml);
        let savedTo = storage.saveAudio(chapter, audio);

        Logger.info(`Saved to: ${savedTo}`);

        if (condition(chapter)) {
            processChapter(chapter + 1, condition);
        }
    }

    processChapter(422, i => i < 422);
})()
