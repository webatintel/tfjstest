const settings = require('./config.json');
const platformBrowser = require('./browser.js');
const { chromium } = require('playwright-chromium');
const path = require('path');
const fs = require('fs');

async function runTensorflowTest(workload, flags) {
  let args = ['--start-maximized'];
  if (flags !== undefined) {
    args = args.concat(flags);
  }
  platformBrowser.configChromePath(settings);
  const userDataDir = path.join(process.cwd(), '../out', 'userData');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: settings.chrome_path,
    viewport: null,
    ignoreHTTPSErrors: true,
    args: args
  });
  const page = await browser.newPage();
  browser.setDefaultNavigationTimeout( 3 * 60 * 1000 );
  await page.goto(workload.url, { waitUntil: 'networkidle' });

  const modelsSelect = await page.$('#gui > ul > li:nth-child(1) > div > ul > li.cr.string > div > div > select');
  if (workload.name.indexOf('ResNet_Tensor') > -1) {
    await modelsSelect.type('posenet_resNet_q4_s32_input224_tensor', {delay: 100});
  } else if (workload.name.indexOf('ResNet_Image') > -1) {
    await modelsSelect.type('posenet_resNet_q4_s32_input224_image', {delay: 100});
  } else if (workload.name.indexOf('MobileNet_Tensor') > -1) {
    await modelsSelect.type('posenet_mobileNet_q2_m75_s16_input513_tensor', {delay: 100});
  } else if (workload.name.indexOf('MobileNet_Image') > -1) {
    await modelsSelect.type('posenet_mobileNet_q2_m75_s16_input513_image', {delay: 100});
  }

  const backendSelect = await page.$('#gui > ul > li:nth-child(4) > div > ul > li.cr.string > div > div > select');
  if (workload.name.indexOf('WASM') > -1) {
    await backendSelect.type('wasm', {delay: 100});
  } else if (workload.name.indexOf('WebGL') > -1) {
    await backendSelect.type('webgl', {delay: 100});
  } else if (workload.name.indexOf('WebGPU') > -1) {
    await backendSelect.type('webgpu', {delay: 100});
  }

  await page.waitForTimeout(3 * 1000);
  // A quick rule-of-thumb is to count the number of await's or then's
  // happening in your code and if there's more than one then you're
  // probably better off running the code inside a page.evaluate call.
  // The reason here is that all async actions have to go back-and-forth
  // between Node's runtime and the browser's, which means all the JSON
  // serialization and deserializiation. While it's not a huge amount of
  // parsing (since it's all backed by WebSockets) it still is taking up
  // time that could better be spent doing something else.
  await page.evaluate(async () => {
    const runButton = document.querySelector('#gui > ul > li:nth-child(5) > div > span');
    runButton.click();
    await new Promise(resolve => setTimeout(resolve, 30 * 1000));
  });
  // Waits for result elements
  await page.waitForSelector('#timings > tbody > tr:nth-child(8) > td:nth-child(2)', { timeout: 10 * 60 * 1000 });

  const resultElem = await page.$('#timings > tbody > tr:nth-child(8) > td:nth-child(2)');
  const result = await resultElem.evaluate(element => element.textContent);
  let results = {};
  console.log(`Result: ${result}`);
  results['Total Score'] = result;

  const resultBody = await page.$('#timings > tbody');
  const resultLength = await resultBody.evaluate(element => element.rows.length);
  for (let i = 1; i < resultLength; i ++) {
    let typeSelector = `#timings > tbody > tr:nth-child(${i}) > td:nth-child(1)`;
    let valueSelector = `#timings > tbody > tr:nth-child(${i}) > td:nth-child(2)`;
    const typeElem = await page.$(typeSelector);
    const valueElem = await page.$(valueSelector);
    const type = await typeElem.evaluate(element => element.innerText);
    const value = await valueElem.evaluate(element => element.innerText);
    results[type] = value;
  }

  //console.log('********** Detailed results: **********');
  //console.log(results);

  await browser.close();

  return Promise.resolve({
    date: Date(),
    results: results
  });
}

module.exports = runTensorflowTest;
