
export class Str
{
    static chunk(content: string, size: number): string[] {
        return this.chunkBy(content, size);
    }

    static  trim(input: string, chars: string[]) {
        chars.forEach((c) => {
            while (input.startsWith(c) || input.endsWith(c)) {
                if (input.startsWith(c)) {
                    input = input.substring(1)
                }

                if (input.endsWith(c)) {
                    input = input.substring(0, input.length - 1)
                }
            }
        });

        return input;
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

            let stop = content.lastIndexOf(stopChar, size);
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