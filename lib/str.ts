
export class Str
{
    static chunk(content: string, size: number): string[] {
        return this.chunkBy(content, size);
    }

    static chunkBy(content: string, size: number, stopChars = ['.', ',']) {
        let rs = [];

        if (content.length < size) {
            rs.push(content);
            return rs;
        }

        while (content.length > size) {
            let stopChar = stopChars.find((c) => content.lastIndexOf(c) !== -1);

            if (! stopChar) {
                rs.push(content);
                return rs;
            }

            let stop = content.lastIndexOf(stopChar);
            let chunk = content.substring(0, stop + 1);
            content = content.substring(stop + 1);
            rs.push(chunk);
    
            if (content.length <= size) {
                rs.push(content);
            }
        }
    
        return rs;
    }
}