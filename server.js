const crypto = require("crypto");
const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");
const app = require("express")();
const bodyParser = require("body-parser");
let config = {};

// Calculate the X-Hub-Signature header value.
function getSignature(buf) {
  var hmac = crypto.createHmac("sha1", process.env.FB_APP_SECRET);
  hmac.update(buf, "utf-8");
  return "sha1=" + hmac.digest("hex");
}

// Verify function compatible with body-parser to retrieve the request payload.
// Read more: https://github.com/expressjs/body-parser#verify
function verifyRequest(req, res, buf, encoding) {
  var expected = req.headers["x-hub-signature"];
  var calculated = getSignature(buf);
  console.log(
    "X-Hub-Signature:",
    expected,
    "Content:",
    "-" + buf.toString("utf8") + "-"
  );
  if (expected !== calculated) {
    throw new Error("Invalid signature.");
  } else {
    console.log("Valid signature!");
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ verify: verifyRequest }));

const startServer = () => {
  app.post("/", (req, res) => {
    const payload = JSON.parse(req.body.payload);
    const repoName = payload.repository.name;

    exec(config?.scripts?.[repoName] || "clear", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

    res.end();
  });

  app.listen(8080);
};

const checkConfig = () => {
  if (fs.existsSync(path.resolve(process.cwd(), "config.json"))) {
    config = require(path.resolve(process.cwd(), "config.json"));
    startServer();
  } else {
    throw new Error("please provide config.json");
  }
};

checkConfig();
