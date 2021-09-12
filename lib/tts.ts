import { sequential } from "./async";
import { NoLimitVoiceNodes, Ssml, Voice, VoiceNode as SsmlVoice, VoiceNode } from "./ssml";
import { Wav } from "./wav";

export interface TtsService {
    speakSsml(content: Ssml): Promise<Buffer>
    speak(content: string, voice: Voice): Promise<Buffer>
    audioProcessor: AudioProcessor
}

export interface LimitedByVoiceNodes {
    maxVoiceNodesAllowed: number
}

function hasVoiceNodesLimitation(tts: any): tts is LimitedByVoiceNodes {
    return 'maxVoiceNodesAllowed' in tts;
}


export interface AudioProcessor {
    join(first: Buffer, second: Buffer): Buffer

    extension: string
}

export class WavProcessor implements AudioProcessor {
    extension = 'wav';

    join(first: Buffer, second: Buffer): Buffer {
        return Wav.join(first, second);
    }
}

export class Mp3Processor implements AudioProcessor {

    extension = 'mp3';

    join(first: Buffer, second: Buffer): Buffer {
        return Buffer.concat([first, second]);
    }
}

export abstract class ChunkTts implements TtsService {

    abstract readonly CHUNK_SIZE: number

    audioProcessor: AudioProcessor;

    constructor(audioProcessor: AudioProcessor) {
        this.audioProcessor = audioProcessor;
    }

    protected abstract sendRequest(content: Ssml): Promise<Buffer>

    async speakSsml(content: Ssml): Promise<Buffer> {
        let maxVoideNodes = hasVoiceNodesLimitation(this) ? this.maxVoiceNodesAllowed : NoLimitVoiceNodes;
        let chunks = content.chunk(this.CHUNK_SIZE, maxVoideNodes);

        let parts = await sequential(chunks, async (chunk) => {
            console.log(`[INFO] Converting ${chunk.length} characters.`);
            return await this.sendRequest(chunk);
        });

        let audio = parts.reduce((result, current) => {
            return this.audioProcessor.join(result, current);
        });

        return audio;
    }

    speak(content: string, voice: Voice): Promise<Buffer> {
        return this.speakSsml(new Ssml(new VoiceNode(voice, content)));
    }
}

export class TtsPool<T extends TtsService > implements TtsService {

    protected chunkSize?: number = null;

    protected pool: T[];

    protected used: number[] = [];
    audioProcessor: AudioProcessor;

    constructor(...pool: T[]) {
        this.pool = pool;
        this.audioProcessor = pool[0].audioProcessor;
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
            return this.audioProcessor.join(result, current);
        });

        return audio;
    }

    private resolveService(): T {
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