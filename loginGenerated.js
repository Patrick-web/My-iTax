const puppeteer = require("puppeteer"); // v13.0.0 or later

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const timeout = 5000;
  page.setDefaultTimeout(timeout);

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

  async function waitForConnected(element, timeout) {
    await waitForFunction(async () => {
      return await element.getProperty("isConnected");
    }, timeout);
  }

  async function waitForInViewport(element, timeout) {
    await waitForFunction(async () => {
      return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
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

  async function waitForElement(step, frame, timeout) {
    const count = step.count || 1;
    const operator = step.operator || ">=";
    const comp = {
      "==": (a, b) => a === b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
    };
    const compFn = comp[operator];
    await waitForFunction(async () => {
      const elements = await querySelectorsAll(step.selectors, frame);
      return compFn(elements.length, count);
    }, timeout);
  }

  async function querySelectorsAll(selectors, frame) {
    for (const selector of selectors) {
      const result = await querySelectorAll(selector, frame);
      if (result.length) {
        return result;
      }
    }
    return [];
  }

  async function querySelectorAll(selector, frame) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error("Empty selector provided to querySelectorAll");
    }
    let elements = [];
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (i === 0) {
        elements = await frame.$$(part);
      } else {
        const tmpElements = elements;
        elements = [];
        for (const el of tmpElements) {
          elements.push(...(await el.$$(part)));
        }
      }
      if (elements.length === 0) {
        return [];
      }
      if (i < selector.length - 1) {
        const tmpElements = [];
        for (const el of elements) {
          const newEl = (
            await el.evaluateHandle((el) =>
              el.shadowRoot ? el.shadowRoot : el
            )
          ).asElement();
          if (newEl) {
            tmpElements.push(newEl);
          }
        }
        elements = tmpElements;
      }
    }
    return elements;
  }

  async function waitForFunction(fn, timeout) {
    let isActive = true;
    setTimeout(() => {
      isActive = false;
    }, timeout);
    while (isActive) {
      const result = await fn();
      if (result) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Timed out");
  }
  {
    const targetPage = page;
    await targetPage.setViewport({ width: 764, height: 637 });
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    await targetPage.goto("https://itax.kra.go.ke/KRA-Portal/");
    await Promise.all(promises);
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [["aria/A017513994H", 'aria/[role="textbox"]'], ["#logid"]],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    const type = await element.evaluate((el) => el.type);
    if (
      [
        "textarea",
        "select-one",
        "text",
        "url",
        "tel",
        "search",
        "password",
        "number",
        "email",
      ].includes(type)
    ) {
      await element.type("A017513994H");
    } else {
      await element.focus();
      await element.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, "A017513994H");
    }
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [
        ['aria/Continue[role="link"]'],
        ["#normalDiv > table > tbody > tr:nth-child(3) > td:nth-child(2) > a"],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 42.984375, y: 8.5 } });
  }
  {
    const targetPage = page;
    const element = await waitForSelectors([["#xxZTT9p2wQ"]], targetPage, {
      timeout,
      visible: true,
    });
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 14.34375, y: 17 } });
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [["aria/  ••••••••••••", 'aria/[role="textbox"]'], ["#xxZTT9p2wQ"]],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    const type = await element.evaluate((el) => el.type);
    if (
      [
        "textarea",
        "select-one",
        "text",
        "url",
        "tel",
        "search",
        "password",
        "number",
        "email",
      ].includes(type)
    ) {
      await element.type("dreydrew6801");
    } else {
      await element.focus();
      await element.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, "dreydrew6801");
    }
  }
  {
    const targetPage = page;
    const element = await waitForSelectors(
      [
        [
          "aria/Please enter the result of arithmatic expression in Security Stamp",
        ],
        ["#captcahText"],
      ],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 29.34375, y: 9 } });
  }
  {
    const targetPage = page;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    const element = await waitForSelectors(
      [['aria/Login[role="link"]'], ["#loginButton"]],
      targetPage,
      { timeout, visible: true }
    );
    await scrollIntoViewIfNeeded(element, timeout);
    await element.click({ offset: { x: 22.59375, y: 5 } });
    await Promise.all(promises);
  }

  await browser.close();
})();
