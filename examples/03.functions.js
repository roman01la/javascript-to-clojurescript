function hello(msg) {
  return msg;
}

const hello = function(msg) {
  return msg;
};

const hello = function fn(msg) {
  return msg;
};

const hello = msg => msg;

hello(123);
