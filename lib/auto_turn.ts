import { Ssml, Voice, VoiceNode as SsmlVoice } from "./ssml";

export class Autoturn {

    normalVoice: Voice;
    quoteVoice: Voice;
    speed: number;

    constructor(normalVoice: Voice, quoteVoice: Voice, speed: number = 1) {
        this.normalVoice = normalVoice;
        this.quoteVoice = quoteVoice;
        this.speed = speed;
    }

    makeup(content: string): Ssml {

        let result = new Ssml;
        while (content.length > 0) {
            let openPos = content.indexOf('"');
            let closePos = content.indexOf('"', openPos + 1);
            // No found close quote
            if (openPos === -1 || closePos === -1) {
                result.voice(new SsmlVoice(this.normalVoice, content.trim()));
                return result;
            }

            // Avoid . at the end after quote
            if (content[closePos + 1] == '.') {
                closePos++;
            }

            let normal = content.substr(0, openPos);
            let quote = content.substring(openPos, closePos + 1);
            content = content.substring(closePos + 1);

            result.voice(new SsmlVoice(this.normalVoice, normal.trim(), this.speed));
            result.voice(new SsmlVoice(this.quoteVoice, quote.trim(), this.speed));
        }

        return result;
    }
}