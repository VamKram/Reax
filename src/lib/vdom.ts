import {RChild, RProps, RType} from "../typing";
import {ELEMENT_TEXT} from "./constants";
import {ReactElement} from "react";

function createElement(type: RType, props: RProps, ...children: RChild[]): ReactElement {
    return {
        type,
        props: {
            ...props,
            children: children.map(childHandler)
        }
    } as any
}

function childHandler(rc: RChild) {
    if (typeof rc === "object") {
        return rc;
    }
    if (typeof rc === "string") {
        return {
            type: ELEMENT_TEXT,
            props: {text: rc, children: []}
        }
    }
    return null;
}


export default createElement

