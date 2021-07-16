import axios from "axios";
import cheerio from "cheerio";

export interface Downloader {
    download(chapter: Chapter): Promise<string>
    resolve(chapter: Chapter): string
}

export type Chapter = string | number;

export class TruyenFull implements Downloader {

    novel: string;

    constructor(novelUrl: string) {
        // trim ending slash
        this.novel = novelUrl.replace(/\/$/, '');
    }

    resolve(chapter: Chapter): string {
        return `${this.novel}/chuong-${chapter}/`
    }

    async download(chapter: Chapter): Promise<string> {
        let response = await axios.get(this.resolve(chapter))
        let html = await response.data;

        let $html = cheerio.load(html);
        let $content = $html("#chapter-c");
        $html("br", "#chapter-c").replaceWith("\n");
        let content = $content.text();

        let siteIdentifiers = [
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

        siteIdentifiers.forEach(search => {
            content = content.replaceAll(search, '');
        })

        let title = 'Bộ truyện: ' + $html('a.truyen-title').text();
        let chapterTitle = $html('a.chapter-title').text();

        return `${title}.
        ${chapterTitle}.
        ${content}
        `;
    }
}