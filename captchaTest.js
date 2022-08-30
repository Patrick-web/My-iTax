const { recognize } = require("node-tesseract-ocr");
const { downloadFile } = require("./utils.js");

(async () => {
  const config = {
    lang: "eng",
    tessedit_char_whitelist: "0123456789-+",
  };

  const res = await recognize("bigCaptcha.png", config);
  console.log(res);
})();
