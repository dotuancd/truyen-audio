
export interface Proxy {
    host: string,
    port: number,
    auth?: {
        username: string
        password: string
    },
    protocol?: string
}

export interface ProxyRotation {
    rotate(): Proxy

    revoke(proxy: Proxy): ProxyRotation
}

// export const NoProxy: ProxyRotation = {

//     rotate(): false {
//         return false
//     },
//     revoke(proxy: Proxy): ProxyRotation {
//         return this;
//     }

// }

export class RandomProxyRotation implements ProxyRotation {
    proxies: Proxy[];

    constructor(proxies: Proxy[]) {
        this.proxies = proxies;
    }

    rotate(): Proxy {
        return this.random();
    }

    random(): Proxy { 
        let choice = +Math.floor(Math.random() * this.proxies.length);

        return this.proxies[choice];
    }

    revoke(proxy: Proxy) {
        this.proxies = this.proxies.filter(p => p.host !== proxy.host);

        return this;
    }
}