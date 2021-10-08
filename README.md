
## INSTALLATION

```
npm install
```

## TTS SERVICES

### Microsoft TTS

```js
let tts = MsTts.factory(config.MS_TTS_KEY, config.MS_TTS_REGION);
```

### Google TTS

```js
let tts = GoogleTts.factory()
```


### Vbee TTS

Vbee limit by request per ip for free plan. So we use proxy rotation to avoid the limitation.

```js
let buyProxies = new BuyProxies(config.BUY_PROXIES_PID, config.BUY_PROXIES_KEY);
let proxies = await buyProxies.proxies();
let tts = new VbeeTts(new RandomProxyRotation(proxies));
```


### Zalo TTS

```js
let tts = new ZaloTts(config.ZALO_KEY);
```

### VNPT TTS

```js
let tts = new Vpnt(config.VPNT_ACCESS_TOKEN, config.VPNT_TOKEN_ID, config.VPNT_TOKEN_KEY)
```

### TTS POOL

Create a pool of tts services. This helpful while you want to avoid limitation by using difference keys for a same tts services.


```js
let tts = new TtsPool(
    GoogleTts.factory(),
    GoogleTts.factory(),
    GoogleTts.factory(),
    GoogleTts.factory(),
    GoogleTts.factory()
);

```


### Autoturn

Uses Autoturn when you want to use difference voices for different contexts. One for storyteller and another for conversation context.

```js
const autoturn = new Autoturn(storytellerVoice, conversationVocie);
```


