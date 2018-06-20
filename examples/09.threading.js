fetch("https://api.github.com/users/roman01la/repos")
  .then(res => res.json())
  .then(json => {
    console.log(JSON.stringify(json[0]));
  })
  .catch(err => console.log(err));
