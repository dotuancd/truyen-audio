

export const sequential = async <T, B>(items: Array<T>, cb: (item: T) => Promise<B>): Promise<Array<B>> => {
    let i = 0;
    let results: Array<B> = [];
    while (i < items.length) {
        results[i] = await cb(items[i]);
        i++;
    }

    return results;
}