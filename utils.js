const axios = require("axios");
const fs = require("fs");
async function waitForSelectors(selectors, frame, options) {
  for (const selector of selectors) {
    try {
      return await waitForSelector(selector, frame, options);
    } catch (err) {
      console.error(err);
    }
  }
  throw new Error(
    "Could not find element for selectors: " + JSON.stringify(selectors)
  );
}

async function scrollIntoViewIfNeeded(element, timeout) {
  await waitForConnected(element, timeout);
  const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
  if (isInViewport) {
    return;
  }
  await element.evaluate((element) => {
    element.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: "auto",
    });
  });
  await waitForInViewport(element, timeout);
}

async function waitForSelector(selector, frame, options) {
  if (!Array.isArray(selector)) {
    selector = [selector];
  }
  if (!selector.length) {
    throw new Error("Empty selector provided to waitForSelector");
  }
  let element = null;
  for (let i = 0; i < selector.length; i++) {
    const part = selector[i];
    if (element) {
      element = await element.waitForSelector(part, options);
    } else {
      element = await frame.waitForSelector(part, options);
    }
    if (!element) {
      throw new Error("Could not find element: " + selector.join(">>"));
    }
    if (i < selector.length - 1) {
      element = (
        await element.evaluateHandle((el) =>
          el.shadowRoot ? el.shadowRoot : el
        )
      ).asElement();
    }
  }
  if (!element) {
    throw new Error("Could not find element: " + selector.join("|"));
  }
  return element;
}

async function downloadFile(url, fileName) {
  const response = await axios({
    url,
    responseType: "stream",
  });
  await new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(fileName))
      .on("finish", () => resolve())
      .on("error", (e) => reject(e));
  }),
    console.log("Image Downloaded");
}

let htmlToInject = `document.body.insertAdjacentHTML('afterBegin','<div id="bigCaptcha" style="width:100px;height:50px;display:flex;align-items:center;justify-content:center"><img alt="Captcha Image" id="captcha_img" name="captcha_img" title="Captcha" width="65" height="15" style="vertical-align:middle;" src="/KRA-Portal/GenerateCaptchaServlet.do?sourcePage=LOGIN&amp;rand=802.0"></div>')`;

module.exports = { downloadFile, waitForSelectors, scrollIntoViewIfNeeded };
