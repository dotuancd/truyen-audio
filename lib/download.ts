import axios from "axios";
import cheerio from "cheerio";

export interface Downloader {
    download(chapter: Chapter): Promise<ChapterInfo>
    resolve(chapter: Chapter): string
}

export type Chapter = string | number;

export interface ChapterInfo {
    novelTitle: string
    chapterTitle: string
    chapterNo: number
    content: string
}

export class TruyenFull implements Downloader {

    novel: string;

    constructor(novelUrl: string) {
        // trim ending slash
        this.novel = novelUrl.replace(/\/$/, '');
    }

    resolve(chapter: Chapter): string {
        return `${this.novel}/chuong-${chapter}/`
    }

    async download(chapter: Chapter): Promise<ChapterInfo> {
        let response = await axios.get(this.resolve(chapter))
        let html = await response.data;

        let $html = cheerio.load(html);

        // Change tag br to \n
        let $content = $html("#chapter-c");
        $html("br", "#chapter-c").replaceWith("\n");
        let content = $content.text();
        content = this.removeSiteIdentities(content);

        content = this.escapeSsmlSpecialCharacters(content);
        content = content.replaceAll('&', ' và ');

        let title: string = $html('a.truyen-title').text();
        let chapterTitle: string = $html('a.chapter-title').text();
        content = `Bộ truyện: ${title}.
        ${chapterTitle}.
        ${content}
        `;

        return {
            novelTitle: title,
            chapterTitle,
            chapterNo: +chapter,
            content,
        }
    }

    private escapeSsmlSpecialCharacters(content: string): string {
        let replacements = {
            '&': ' và '
        };

        return Object.keys(replacements).reduce((content, search) => {
            return content.replaceAll(search, replacements[search]);
        }, content);
    }

    private removeSiteIdentities(content: string): string {
        
        let keywords = [
            "Bạn đang xem tại Truyện FULL - truyenfull.vn",
            "Bạn đang đọc truyện tại Truyện FULL- www.Truyện FULL",
            "Bạn đang đọc truyện được copy tại Truyện FULL",
            "Bạn đang đọc truyện tại - http://truyenfull.vn",
            "Bạn đang đọc truyện được lấy tại chấm cơm.",
            /Bạn đang đọc truyện được lấy tại\s+chấm cơm/g,
            "xem tại TruyenFull.vn",
            'Bạn đang đọc truyện tại',
            /Truyện FULL/gi,
            /https?\:\/\/truyenfull.vn/g,
            'www'
        ]

        keywords.forEach(search => {
            content = content.replaceAll(search, '');
        });

        return content;
    }
}