
import { Proxy } from "../proxy_rotation";

export interface ProxyService {
    proxies(): Promise<Proxy[]>
}