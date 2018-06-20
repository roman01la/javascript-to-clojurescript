const x = {
  a: 1,
  hi(msg) {
    console.log(msg);
  }
};

x.hi("hey");

x.a = { b: 1 };

x.a.b = 3;

console.log(x.a.b);
