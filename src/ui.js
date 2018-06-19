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

// =================

let exampleCode = `function dist(p1, p2) {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;

  return Math.sqrt( a*a + b*b );
}

{ // explicit block scope
  const p1 = { x: 1, y: -9 };
  const p2 = { x: -4, y: 13 };
  
  const d = dist(p1, p2);

  console.log("Distance: " + d);
  
  if (d > 0) {
      const apxd = Math.round(d);
      console.log("Distance is positive!", "≈" + apxd);
  }
}

// cond
if (0 > 1) {
	console.log("0 > 1");
} else if (1 < 0) {
	console.log("0 > 1");
} else if (9 < -9) {
	console.log("9 < -9");
}

// case
switch (1) {
  case 4:
    const h = 1;
    console.log(h);
    break;
  case 3:
    console.log(3);
    break;
  default:
    console.log("default case");
}`;

if (location.hash === "#react") {
  exampleCode = `function State(initial) {
  	const ctx = { st: initial, listeners: [] };
    return {
        update: (next) => {
            ctx.st = Object.assign(ctx.st, next);
            ctx.listeners.forEach(fn => fn(ctx.st));
        },
        deref: () => ctx.st,
        listen: (f) => ctx.listeners.push(f)
      };
  };
  
  const state = new State({ value: "", repos: [] });
  
  function handleSubmit(e, uname) {
      console.log(uname);
    e.preventDefault();
    fetch("https://api.github.com/users/" + uname + "/repos")
        .then(res => res.json())
        .then(json => {
            console.log(JSON.stringify(json[0]));
          state.update({repos:json});
        })
        .catch(err => console.log(err));
  }
  
  const App = (st) => html(
    <div>
      <form onSubmit={e => handleSubmit(e, st.value)}>
          <input placeholder="GitHub user name"
             value={st.value}
             onChange={e => {
                               state.update({value: e.target.value})
                              }} />
          <button>Fetch</button>
        </form>
        {"repos fetched: " + st.repos.length}
      </div>
  );
  
  const render = (st) => ReactDOM.render(App(st), document.getElementById("react-root"));
  
  render(state.deref());
  
  state.listen(render);
  
  `;
}

exampleCode = `import AutosizeInput from 'react-input-autosize';
import { findDOMNode } from 'react-dom';
import * as f from 'react-dom';`;

const jsEditor = new CodeMirror(window.jsCode, {
  lineNumbers: true,
  mode: "javascript"
});
jsEditor.setValue(exampleCode);

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
    const code = js2cljs(jsEditor.getValue());
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

handleJSChange();
