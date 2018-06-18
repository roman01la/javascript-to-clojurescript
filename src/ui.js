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

const p1 = { x: 1, y: -9 };
const p2 = { x: -4, y: 13 };

console.log("Distance: " + dist(p1, p2));`;

if (location.hash === "#react") {
  exampleCode = `function State(initial) {
    let st = initial;
      const listeners = [];
    return {
        update: (next) => {
            st = Object.assign(st, next);
              listeners.forEach(fn => fn(st));
          },
          deref: () => st,
          listen: (f) => listeners.push(f)
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
        console.log = x => {
          const v = stdoutEditor.getValue();
          stdoutEditor.setValue(v + "\n" + x);
        };
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
