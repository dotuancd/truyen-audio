export class Copyright
{
    copyright: string;

    constructor(copyright: string) {
        this.copyright = copyright;
    }

    addTo(content: string): string {   
        let parts = content.split("\n");
   
        let baseParts = 5;
   
        let position = Math.floor(Math.random() * baseParts) * Math.floor(parts.length / baseParts);
   
        return [...parts.slice(0, position), this.copyright, ...parts.slice(position)].join("\n");
    }

    static default() {

        const copyright = `Bạn đang nghe truyện tại Truyện Trung Quốc.
Truyện Trung Quốc có trên các nền tảng Spotify, Apple Podcasts, Google Podcasts.
Chúc các bạn nghe truyện vui vẻ. `;

        return new Copyright(copyright);
    }
}