import { sequential } from "./async";
import { NoLimitVoiceNodes, Ssml, Voice, VoiceNode as SsmlVoice, VoiceNode } from "./ssml";
import { Wav } from "./wav";

export interface TtsService {
    speakSsml(content: Ssml): Promise<Buffer>
    speak(content: string, voice: Voice): Promise<Buffer>
}

export interface LimitedByVoiceNodes {
    maxVoiceNodesAllowed: number
}

function hasVoiceNodesLimitation(tts: any): tts is LimitedByVoiceNodes {
    return 'maxVoiceNodesAllowed' in tts;
}

export abstract class ChunkTts implements TtsService {

    abstract readonly CHUNK_SIZE: number

    protected abstract sendRequest(content: Ssml): Promise<Buffer>

    async speakSsml(content: Ssml): Promise<Buffer> {
        let maxVoideNodes = hasVoiceNodesLimitation(this) ? this.maxVoiceNodesAllowed : NoLimitVoiceNodes;
        let chunks = content.chunk(this.CHUNK_SIZE, maxVoideNodes);

        let parts = await sequential(chunks, async (chunk) => {
            console.log(`[INFO] Converting ${chunk.length} characters.`);
            return await this.sendRequest(chunk);
        });

        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        });

        return audio;
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        return this.speakSsml(new Ssml(new VoiceNode(voice, content)));
    }
}

export class TtsPool implements TtsService {

    protected chunkSize?: number = null;

    protected pool: TtsService[];

    protected used: number[] = [];

    constructor(...pool: TtsService[]) {
        this.pool = pool;
        this.used = pool.map(_ => 0);
    }

    setChunkSize(chunk: number) {
        this.chunkSize = chunk;
        return this;
    }

    async speakSsml(content: Ssml): Promise<Buffer> {
        let chunks = this.chunkSize ? content.chunk(this.chunkSize) : [content];

        let parts = await Promise.all(chunks.map(async (chunk) => {
            return this.resolveService().speakSsml(chunk);
        }));
        
        let audio = parts.reduce((result, current) => {
            return Wav.join(result, current);
        });

        return audio;
    }

    private resolveService(): TtsService {
        let max = this.used.reduce((max, current) => max < current ? current : max);
        let found = this.used.find((usage) => usage < max);
        if (found === undefined) {
            found = 0;
        }

        this.used[found]++;
        return this.pool[found];
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        return this.speakSsml(new Ssml(new SsmlVoice(voice, content)));
    }
}