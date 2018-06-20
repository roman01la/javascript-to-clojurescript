const js2cljs = require("./index");

window.html = j2c.core.compileHiccup;

const overlay = document.querySelector(".popup-overlay");
const popup = document.querySelector(".popup");

const closePopup = () => {
  popup.remove();
  overlay.remove();
};

overlay.addEventListener("click", closePopup);
window["close-btn"].addEventListener("click", closePopup);

if (popup.clientWidth >= document.body.clientWidth) {
  popup.style.width = `${document.body.clientWidth - 96}px`;
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

r(window.location.hash || "basic");

select.value = window.location.hash.replace("#", "") || "basic";

select.addEventListener("change", e => {
  const val = e.target.value;
  window.location.hash = val;
});
