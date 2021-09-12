import { ProxyService } from "./proxy-service";
import { Proxy } from "../proxy_rotation";
import axios from "axios";

export class BuyProxies implements ProxyService {
    accountId: string;
    accountSecret: string;
    
    constructor(accountId: string, accountSecret: string) {
        this.accountId = accountId;
        this.accountSecret = accountSecret;
    }

    async proxies(): Promise<Proxy[]> {
        let response = await axios.get(`http://api.buyproxies.org/?a=showProxies&pid=${this.accountId}&key=${this.accountSecret}`);

        let lines: string[] = response.data.split("\n");

        return lines.map(line => {
            let [host, port, username, password] = line.split(":");

            return {host, port: +port, auth: {username, password}};
        });
    }
}