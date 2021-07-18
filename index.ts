
import * as dotenv from 'dotenv'
import { Downloader, TruyenFull } from './lib/download';
import { Copyright } from './lib/copyright';
import { Logger } from './lib/logger';
import { Tts, TtsPool, Voice } from './lib/tts';
import { SpeechConfig } from 'microsoft-cognitiveservices-speech-sdk';
import { DefaultFilenameResolver, PrefixFilenameResolver, Storage } from './lib/storage';
import { Autoturn } from './lib/auto_turn';

const config = dotenv.config().parsed;

(async () => {
    // const pool = [
    //     new Tts(SpeechConfig.fromSubscription(config.MS_TTS_KEY, config.MS_TTS_REGION)),
    //     new Tts(SpeechConfig.fromSubscription(config.MS_TTS_KEY, config.MS_TTS_REGION)),
    // ];
    // let tts = new TtsPool(...pool);

    const speechConfig = SpeechConfig.fromSubscription(config.MS_TTS_KEY, config.MS_TTS_REGION);
    let tts = new Tts(speechConfig);
    // const downloader: Downloader = new TruyenFull('https://truyenfull.vn/the-gioi-hoan-my');
    const downloader: Downloader = new TruyenFull('https://truyenfull.vn/dau-la-dai-luc-230420');
    const copyright = Copyright.loadFromFile('copyright.txt');
    const autoturner = new Autoturn(Voice.NamMinh, Voice.HoaiMy);

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

        // Run text to speech & save it to output directory
        Logger.info(`Converting text to speech - Chapter ${chapter}`);
        let ssml = autoturner.makeup(content);
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

    processChapter(413, i => i < 414);
})()
