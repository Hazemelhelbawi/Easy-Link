import { createApp } from './app.js';
import { serverConfig } from './config.js';
import { initDataDirs, ensurePeopleSeed } from './services/store.js';
import { rebuildCacheFromDisk } from './services/reportCache.js';

await initDataDirs();
await ensurePeopleSeed();
await rebuildCacheFromDisk();

const app = createApp();
app.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`EasyLink backend listening on http://${serverConfig.host}:${serverConfig.port}`);
});
