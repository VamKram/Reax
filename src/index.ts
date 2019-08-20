import {createElement, reaxDom} from './lib';

const Element = createElement("div", {
    id: "a"
}, createElement("div", {
    id: "b1"
}, "123", createElement("div", {
    id: "b1c1"
}, "123"), createElement("div", {
    id: "b1c2"
}, "123")), createElement("div", {
    id: "b2"
}, "123", createElement("div", {
    id: "b2c1"
}, "123"), createElement("div", {
    id: "b2c2"
}, "123")));
reaxDom.render(Element, document.getElementById("root") as HTMLElement)

