const App = () => {
  const [state, setState] = React.useState({ value: "", repos: [] });

  function handleSubmit(e, uname) {
    e.preventDefault();
    fetch("https://api.github.com/users/" + uname + "/repos")
      .then(res => res.json())
      .then(json => {
        setState({ ...state, repos: json });
      })
      .catch(err => console.log(err));
  }

  return html(
    <div>
      <form onSubmit={e => handleSubmit(e, state.value)}>
        <input
          placeholder="GitHub user name"
          value={state.value}
          onChange={e => {
            setState({ ...state, value: e.target.value });
          }}
        />
        <button>Fetch</button>
      </form>
      {"repos fetched: " + state.repos.length}
    </div>
  );
};

ReactDOM.render(
  React.createElement(App),
  document.getElementById("react-root")
);
