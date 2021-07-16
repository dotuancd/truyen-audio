export class Wav {
    static join(first: Buffer, second: Buffer): Buffer {
        let firstSize = first.readUInt32LE(40);
        let secondSize = second.readUInt32LE(40);
    
        first.writeUInt32LE(firstSize + secondSize, 40);

        return Buffer.concat([first, second.slice(44)]);
    }
}