const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  resources: "usable"
});

dom.window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.log("ERROR in app:", msg, error);
};

// Mock localStorage
dom.window.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
dom.window.navigator.vibrate = () => {};

// Load scripts manually
const storage = fs.readFileSync('src/js/storage.js', 'utf8');
const analytics = fs.readFileSync('src/js/analytics.js', 'utf8');
const bodymap = fs.readFileSync('src/js/components/bodymap.js', 'utf8');
const breathing = fs.readFileSync('src/js/components/breathing.js', 'utf8');
const distraction = fs.readFileSync('src/js/components/distraction.js', 'utf8');
const doctorReport = fs.readFileSync('src/js/components/doctorReport.js', 'utf8');
const app = fs.readFileSync('src/js/app.js', 'utf8');

try {
  dom.window.eval(storage);
  dom.window.eval(analytics);
  dom.window.eval(bodymap);
  dom.window.eval(breathing);
  dom.window.eval(distraction);
  dom.window.eval(doctorReport);
  dom.window.eval(app);
  
  setTimeout(() => {
    console.log("Checking if spendSpoons exists:", !!dom.window.spendSpoons);
    if (dom.window.spendSpoons) {
        dom.window.spendSpoons(1);
    }
  }, 1000);
} catch(e) {
  console.log("EVAL ERROR:", e);
}
