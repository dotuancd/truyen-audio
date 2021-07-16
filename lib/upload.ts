interface Uploader
{
    upload(file: string, target: string): boolean
}

class AnchorFmUploader implements Uploader
{
    upload(file: string, target: string): boolean {
        return false;
    }
}
