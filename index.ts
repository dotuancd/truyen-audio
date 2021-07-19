import * as dotenv from 'dotenv'
import { Downloader, TruyenFull } from './lib/download';
import { Copyright } from './lib/copyright';
import { Logger } from './lib/logger';
import { TtsPool} from './lib/tts';
import { DefaultFilenameResolver, PrefixFilenameResolver, Storage } from './lib/storage';
import { Autoturn } from './lib/auto_turn';
import { GoogleTts, GVoices } from './lib/tts-services/gg-tts';
import { MsTts, MsVoices } from './lib/tts-services/ms-tts';

const config = dotenv.config().parsed;

(async () => {

    let tts = MsTts.factory(config.MS_TTS_KEY, config.MS_TTS_REGION);
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
    const autoturn = new Autoturn(MsVoices.NamMinh, MsVoices.HoaiMy);
    // const autoturner = new Autoturn(GVoices.WavenetA, GVoices.WavenetD);
    const outro = Copyright.loadFromFile('outro.txt');

    const storage = new Storage(
        "output/dau-la-dai-luc",
        new PrefixFilenameResolver("dldl-chuong-", DefaultFilenameResolver)
    );
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

    processChapter(419, i => i < 419);
})()
