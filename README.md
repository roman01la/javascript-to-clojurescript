[![SWUbanner](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner-personal-page.svg)](https://stand-with-ukraine.pp.ua/)

# JavaScript to ClojureScript translator

This tool tries to translate as much JavaScript code into ClojureScript as it can. Keep in mind that it might fail or the result will be non-idiomatic Clojure code due to substantial differences between languages.

_e.g. Clojure explicitly distincts global and local vars, but JavaScript does not_

```clojure
(def x 1) ;; global
(let [x 2] ;; local
  (/ x 2))
```

_Clojure's data structures are immutable by defalt_

```clojure
(let [x {}]
  [(assoc x :y 1) x])
  ;; [{:y 1} {}]
```

Use for educational purpose.

## How to contribute
If something is not translated properly, file an issue
