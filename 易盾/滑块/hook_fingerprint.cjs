const fs = require('fs');
const LOG = process.env.TEMP + '\\hook_log.txt';
function log(...a) { fs.appendFileSync(LOG, a.join(' ') + '\n'); }
const { createRequire } = require('node:module');
const require_ = createRequire('C:\\Users\\DELL\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\415ffebf3d576e9b\\bin\\node_modules\\_e.mjs');
const pw = require_('playwright-core');

(async () => {
  fs.writeFileSync(LOG, 'start2\n');
  const browser = await pw.chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Debugger.enable');
  log('debugger enabled');

  const js = fs.readFileSync(process.env.TEMP + '\\ir.2.0.13.min.js', 'utf8');
  const lines = js.split('\n');
  let col = 96175;
  for (let li = 0; li < 3; li++) col -= lines[li].length + 1;

  let bpSet = false;
  cdp.on('Debugger.scriptParsed', async (e) => {
    if (e.url.includes('ir.2.0.13.min.js') && !bpSet) {
      bpSet = true;
      log('SCRIPT PARSED:', e.url, e.scriptId);
      try {
        await cdp.send('Debugger.setBreakpoint', {
          location: { scriptId: e.scriptId, lineNumber: 3, columnNumber: col }
        });
        log('breakpoint set OK');
      } catch (err) { log('bp err: ' + err.message); }
    }
  });

  const pausedP = new Promise((resolve) => {
    cdp.on('Debugger.paused', async (p) => {
      log('PAUSED reason=' + p.reason + ' frames=' + p.callFrames.length);
      const cf = p.callFrames[0];
      log('top frame:', (cf.url||'inline'), cf.location.lineNumber + ':' + cf.location.columnNumber, 'fn=' + (cf.functionName||''));
      try {
        const r = await cdp.send('Debugger.evaluateOnCallFrame', {
          callFrameId: cf.callFrameId,
          expression: 'JSON.stringify({t: t, o: o, f: f})',
          returnByValue: true
        });
        if (r.exceptionDetails) {
          log('EXCEPTION: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description));
        } else {
          const data = JSON.parse(r.result.value);
          log('captured lens t/o/f:', data.t.length, data.o.length, data.f.length);
          const total = [].concat(data.t, data.o, data.f).reduce((a, x) => a + x.length, 0);
          log('total bytes:', total);
          fs.writeFileSync(process.env.TEMP + '\\hooked_arrays.json', JSON.stringify(data));
          log('SAVED hooked_arrays.json');
        }
      } catch (err) { log('eval err: ' + err.message); }
      try { await cdp.send('Debugger.resume'); } catch (e) {}
      resolve(true);
    });
  });

  await page.goto('https://dun.163.com/trial/jigsaw', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => log('nav err: ' + e.message));
  log('goto done, waiting for pause...');
  const timer = setTimeout(() => { log('TIMEOUT'); process.exit(2); }, 75000);
  await pausedP;
  clearTimeout(timer);
  await page.waitForTimeout(3000);
  await browser.close();
  log('done');
  process.exit(0);
})().catch(e => { fs.appendFileSync(LOG, 'FATAL ' + e.message + '\n'); process.exit(1); });
