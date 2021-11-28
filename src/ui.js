const js2cljs = require("./index");
const pako = require("pako");

window.html = j2c.core.compileHiccup;

const overlay = document.querySelector(".popup-overlay");
const popup = document.querySelector(".popup");

const openPopup = () => {
  popup.style.display = "block";
  overlay.style.display = "block";
};

const closePopup = () => {
  popup.remove();
  overlay.remove();
};

if (localStorage.getItem("seen-popup?") === "1") {
  closePopup();
} else {
  openPopup();
  localStorage.setItem("seen-popup?", "1");
  overlay.addEventListener("click", closePopup);
  window["close-btn"].addEventListener("click", closePopup);
  if (popup.clientWidth >= document.body.clientWidth) {
    popup.style.width = `${document.body.clientWidth - 96}px`;
  }
}

function router({ urls, fn }) {
  const handle = v => {
    const r = v.replace("#", "");
    if (urls.includes(r)) {
      return fn(r);
    }
  };
  window.addEventListener("hashchange", e => handle(window.location.hash));
  return handle;
}

// =================

const examples = {
  primitives: "01.primitives.js",
  variables: "02.variables.js",
  functions: "03.functions.js",
  conditionals: "04.conditionals.js",
  operators: "05.operators.js",
  array: "06.array.js",
  object: "07.object.js",
  "try..catch": "08.try-catch.js",
  threading: "09.threading.js",
  basic: "basic.js",
  react: "react.js"
};

const loadExample = id => fetch(`examples/${examples[id]}`).then(r => r.text());

const jsEditor = new CodeMirror(window.jsCode, {
  lineNumbers: true,
  mode: "javascript"
});

const cljsEditor = new CodeMirror(window.cljsCode, {
  lineNumbers: true,
  readOnly: true,
  mode: "clojure"
});

const stdoutEditor = new CodeMirror(window.stdout, { readOnly: true });
const cljsCompiledCodeEditor = new CodeMirror(window.cljsCompiledCode, {
  readOnly: true
});

const debounce = (t, fn) => {
  let id;
  return (...args) => {
    if (id !== undefined) {
      clearTimeout(id);
    }
    id = setTimeout(() => {
      fn(...args);
    }, t);
  };
};

console.log = (...args) => {
  const v = stdoutEditor.getValue();
  stdoutEditor.setValue(v + "\n" + args.join(" "));
};
console.error = (...args) => {
  const v = stdoutEditor.getValue();
  stdoutEditor.setValue(v + "\n" + args.join(" "));
};

const handleJSChange = () => {
  stdoutEditor.setValue("");

  try {
    const code = js2cljs.transform(jsEditor.getValue());
    cljsEditor.setValue(code);
    j2c.core.evalExpr(code, (err, code) => {
      if (err) {
        console.error(err);
      } else {
        cljsCompiledCodeEditor.setValue(code);
        updateShareLink();
        window.cljs.user = {};
        try {
          eval(code);
        } catch (err) {
          console.log(err);
        }
      }
    });
  } catch (err) {
    console.error(err);
    console.error(`Couldn't compile JavaScript code into ClojureScript :(`);
  }
};

const handleJSChangeD = debounce(1000, handleJSChange);

jsEditor.on("change", handleJSChangeD);

const loadExampleAndDisplay = id =>
  loadExample(id)
    .then(code => {
      jsEditor.setValue(code);
    })
    .catch(() => {
      alert(`Couldn't load example "${val}"`);
    });

const r = router({
  urls: Object.keys(examples).concat([""]),
  fn: loadExampleAndDisplay
});

const h = (tag, attrs, ...children) => {
  const el = document.createElement(tag);
  Object.assign(el, attrs);
  el.append(...children);
  return el;
};

const options = Object.keys(examples).map(id => h("option", { value: id }, id));
const select = h("select", {}, ...options);

document.querySelector(".selector").append(select);

const shareLink = (window.location.hash.match(/#share-link=([0-9,]+)/) || [])[1];
if (shareLink) {
  jsEditor.setValue(decodeLinkedExample(shareLink));
} else {
  r(window.location.hash || "basic");
  select.value = window.location.hash.replace("#", "") || "basic";
}

select.addEventListener("change", e => {
  const val = e.target.value;
  window.location.hash = val;
});

const tabToView = {
  "btn-cljs": document.querySelector("#view-cljs"),
  "btn-ccljs": document.querySelector("#view-ccljs"),
  "btn-console": document.querySelector("#view-console"),
  "btn-dom": document.querySelector("#view-dom")
};

const tabs = document.querySelectorAll(".tabs .btn");
Array.from(tabs).forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".tabs .btn.active").classList.remove("active");
    btn.classList.add("active");
    tabToView[btn.id].style.display = "flex";

    if (btn.id === "btn-ccljs") {
      cljsCompiledCodeEditor.setValue(cljsCompiledCodeEditor.getValue());
    }
    if (btn.id === "btn-console") {
      stdoutEditor.setValue(stdoutEditor.getValue());
    }

    Object.entries(tabToView).forEach(([id, view]) => {
      if (id !== btn.id) {
        view.style.display = "none";
      }
    });
  });
});

function decodeLinkedExample(s) {
  return pako.inflate(new Uint8Array(s.split(",")), { to: 'string' });
}

function updateShareLink() {
  const compressed = pako.deflate(jsEditor.getValue());
  window.location.hash = `#share-link=${compressed.join()}`;
}

function shareCurrentExample() {
  const compressed = pako.deflate(jsEditor.getValue());
  const hash = `#share-link=${compressed.join()}`;
  const shareLink = `https://roman01la.github.io/javascript-to-clojurescript/${hash}`;
  navigator.clipboard.writeText(shareLink)
    .then(() => alert("Link copied!"))
    .catch(() => alert("Couldn't copy the link, please copy it from here\n" + shareLink));
  window.location.hash = hash;
}

document.getElementById("btn-share")
  .addEventListener("click", shareCurrentExample)
