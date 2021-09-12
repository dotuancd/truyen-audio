export class Logger {
    static info(message: any) {
        let formatted = typeof message == 'object' ? JSON.stringify(message) : message;
        console.info(`[INFO] ${formatted}`);
    }
}