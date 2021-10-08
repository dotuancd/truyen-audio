import { serialize } from "cheerio/lib/api/forms";
import { sequential } from "../async";
import { Ssml, Voice, VoiceNode } from "../ssml";
import { AudioProcessor, TtsService } from "../tts";

export interface NoSsmlTts {
    createAudioForVoice(voice: VoiceNode): Promise<Buffer>
}

export class NoSsmlDecorator implements TtsService {

    private service: NoSsmlTts;
    audioProcessor: AudioProcessor;

    constructor(service: NoSsmlTts, audioProcessor: AudioProcessor) {
        this.service = service;
        this.audioProcessor = audioProcessor;
    }

    async speakSsml(content: Ssml): Promise<Buffer> {
        let removeStopChars = (input: string) => input.replace(/^\W+/, "").replace(/\W+$/, "");
        let voices = content.voices.filter(v => v.length !== 0 && removeStopChars(v.content).length > 0);
        if (voices.length === 0) {
            return Buffer.from([]);
        }

        let buffers = await sequential(voices, async (voice) => {
            return await this.service.createAudioForVoice(voice);
        });

        return buffers.reduce((rs, current) => {
            if (current.length === 0) {
                return rs;
            }
            
            return this.audioProcessor.join(rs, current);
        });
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        throw new Error("Method not implemented.");
    }
}