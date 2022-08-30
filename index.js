const puppeteer = require("puppeteer");
const { waitForSelectors } = require("./utils.js");
const { recognize } = require("node-tesseract-ocr");
const TIMEOUT = 5000;
require("dotenv").config();

start();

async function start() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const [page] = await browser.pages();
  page.setViewport({ width: 1300, height: 637 });

  const promises = [];
  promises.push(page.waitForNavigation());

  //Navigate to lgin page
  await page.goto("https://itax.kra.go.ke/KRA-Portal/");
  await Promise.all(promises);

  await login(page);
  const accountInfo = await getAccountInfo(page);
  await fileNilReturn(page, "Income Tax - Resident Individual");
  // await browser.close();
}

async function getAccountInfo(accountPage) {
  await accountPage.waitForNavigation();
  await waitForSelectors([[".mainBannerTable"]], accountPage, {
    TIMEOUT,
    visible: true,
  });
  const welcomeText = await accountPage.evaluate(() => {
    return document.querySelector(".mainBannerTable").querySelector("b")
      .textContent;
  });
  const userInfo = {
    pinNumber: welcomeText
      .match(/\(.*\)/)[0]
      .replace("(", "")
      .replace(")", ""),
    fullname: welcomeText
      .match(/([a-z]*)\s/gim)
      .splice(1, 3)
      .join(" ")
      .trim(),
  };
  return userInfo;
}

async function fileNilReturn(accountPage, taxObligation) {
  await accountPage.evaluate(() => window.showNilReturn());
  await accountPage.waitForNavigation();
  await accountPage.evaluate((taxObligation) => {
    const taxObligationDiv = document.querySelector("#regType");
    const options = Array.from(taxObligationDiv.options);
    const obligations = new Map();
    options.forEach((el, index) => {
      obligations.set(el.textContent, { value: el.value, index });
    });
    console.log(obligations);
    const selectedObligation = obligations.get(taxObligation);
    taxObligationDiv.selectedIndex = selectedObligation.index;
    taxObligationDiv.value = selectedObligation.value;
    taxObligationDiv.dispatchEvent(new Event("input", { bubbles: true }));
    taxObligationDiv.dispatchEvent(new Event("change", { bubbles: true }));
  }, taxObligation);
  await accountPage.evaluate(() => {
    window.showSelTaxType();
    return;
  });
  await accountPage.waitForNavigation();
  //submit form
  const taxSubmitBtn = await accountPage.$("#sbmt_btn");
  taxSubmitBtn.click();
  //accept dialog prompt
  accountPage.on("dialog", (dialog) => {
    dialog.accept();
  });
  await accountPage.waitForNavigation();
  accountPage.screenshot({ path: "./local_tests/onSubmitting.png" });
  console.log("Done. Hurray");
}

async function login(loginPage) {
  const crendentials = {
    pin: `${process.env.TEST_PIN}`,
    password: `${process.env.TEST_PASSWORD}`,
  };

  await waitForSelectors([["#logid"]], loginPage, {
    TIMEOUT,
    visible: true,
  });
  await loginPage.evaluate(() => {
    document.querySelector("#mainDiv").style.display = "none";
    document.querySelector("#successDiv").style.display = "initial";
    return;
  });
  const pinInput = await loginPage.$("#userName");
  await pinInput.type(crendentials.pin);
  const passwordInput = await loginPage.$("#xxZTT9p2wQ");
  await passwordInput.type(crendentials.password);

  //Fix captcha dimensions
  await loginPage.evaluate(() => {
    const captchaHTML = document.querySelector("#captcha_img").outerHTML;
    document.body.insertAdjacentHTML(
      "afterBegin",
      `<div id="bigCaptcha" style="width:100px;height:50px;display:flex;align-items:center;justify-content:center">${captchaHTML}</div`
    );
    return;
  });

  const bigCaptchaElement = await loginPage.$("#bigCaptcha");
  console.log(bigCaptchaElement);
  bigCaptchaElement.screenshot({ path: "./bigCaptcha.png" });
  // Recognize Captcha Text
  const config = {
    lang: "eng",
    tessedit_char_whitelist: "0123456789-+?",
  };
  let captchaText = await recognize("./bigCaptcha.png", config);
  // Run Fixes Captcha Recognition
  captchaText = captchaText.trim().replace("-+", "+");
  console.log(captchaText.includes("?"));
  //Fix 1: Fix ? being mistaken for 7
  if (captchaText.includes("?") == false) {
    captchaText = captchaText.slice(0, -1);
  }
  //Fix 2: Fix + being mistaken for 4
  if (["+", "-"].some((c) => captchaText.includes(c)) == false) {
    captchaText.replace("4", "+");
  }
  //Clean up expression
  captchaText = captchaText.replace("?", "");

  console.log(captchaText);
  //Solve Captcha Expression
  function solveStringExpression(str) {
    return Function(`'use strict'; return (${str})`)();
  }
  const captchaSolution = solveStringExpression(captchaText);
  console.log(captchaSolution);

  //Enter captcha solution
  const captchaInput = await loginPage.$("#captcahText");
  await captchaInput.type(`${captchaSolution}`);

  await loginPage.evaluate(() => {
    window.submitForm1();
  });
  // const loginButton = await loginPage.$("#loginButton");
  // loginButton.click();
}
