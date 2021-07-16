
import * as dotenv from 'dotenv'
import { Downloader, TruyenFull } from './lib/download';
import { Copyright } from './lib/copyright';
import { Logger } from './lib/logger';
import { Tts, Voice } from './lib/tts';
import { SpeechConfig } from 'microsoft-cognitiveservices-speech-sdk';
import { Storage } from './lib/storage';

const config = dotenv.config().parsed;

(async () => {
    const speechConfig = SpeechConfig.fromSubscription(config.MS_TTS_KEY, config.MS_TTS_REGION);
    let tts = new Tts(speechConfig);
    const downloader: Downloader = new TruyenFull('https://truyenfull.vn/the-gioi-hoan-my');
    const copyright = Copyright.default();
    const storage = new Storage("output/the-gioi-hoan-my", "chuong-");

    const processChapter = async (chapter: number, condition: (chapter: number) => boolean) => {
        Logger.info(`Downloading chapter ${chapter}`);

        // Download content
        let content = await downloader.download(chapter);

        // Adding copy right
        content = copyright.addTo(content);

        console.log(content);

        // Run text to speech & save it to output directory
        Logger.info(`Converting text to speech`);
        let audio = await tts.speakConcat(content, Voice.NamMinh);
        let savedTo = storage.save(chapter, audio);

        Logger.info(`Saved to: ${savedTo}`);

        if (condition(chapter)) {
            processChapter(chapter + 1, condition);
        }
    }


    processChapter(116, i => i < 130);
})()
