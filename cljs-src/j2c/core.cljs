(ns j2c.core
  (:require [cljs.js :as cljs]
            [cljs.spec.alpha :as s]))

(s/def :hiccup/form
  (s/or
    :string string?
    :number number?
    :element :hiccup/element))

(s/def :hiccup/element
  (s/cat
    :tag #(or (keyword? %) (symbol? %) (fn? %))
    :attrs (s/? map?)
    :children (s/* :hiccup/form)))

(defn parse-hiccup [hiccup]
  (s/conform :hiccup/form hiccup))

(defmulti html first)

(defmethod html :default [[_ v]]
  v)

(defmethod html :element [[_ {:keys [tag attrs children]}]]
  (apply js/React.createElement
    (if (keyword? tag)
      (name tag)
      tag)
    (clj->js attrs)
    (map html children)))

(defn ^:export compileHiccup [form]
  (html (parse-hiccup form)))

;; ================

(defn ^:export evalExpr
  ([source cb]
    (cljs/compile-str (cljs/empty-state) source 'cljs.user
      {:eval cljs/js-eval}
      (fn [{:keys [error value]}]
        (if-not error
          (cb nil value)
          (cb (.. error -cause -stack)))))))