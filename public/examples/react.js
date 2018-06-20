function State(initial) {
  const ctx = { st: initial, listeners: [] };
  return {
    update: next => {
      ctx.st = Object.assign(ctx.st, next);
      ctx.listeners.forEach(fn => fn(ctx.st));
    },
    deref: () => ctx.st,
    listen: f => ctx.listeners.push(f)
  };
}

const state = new State({ value: "", repos: [] });

function handleSubmit(e, uname) {
  console.log(uname);
  e.preventDefault();
  fetch("https://api.github.com/users/" + uname + "/repos")
    .then(res => res.json())
    .then(json => {
      console.log(JSON.stringify(json[0]));
      state.update({ repos: json });
    })
    .catch(err => console.log(err));
}

const App = st =>
  html(
    <div>
      <form onSubmit={e => handleSubmit(e, st.value)}>
        <input
          placeholder="GitHub user name"
          value={st.value}
          onChange={e => {
            state.update({ value: e.target.value });
          }}
        />
        <button>Fetch</button>
      </form>
      {"repos fetched: " + st.repos.length}
    </div>
  );

const render = st =>
  ReactDOM.render(App(st), document.getElementById("react-root"));

render(state.deref());

state.listen(render);
