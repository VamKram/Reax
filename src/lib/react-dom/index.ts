import {ReactElement} from "react";
import * as ReaxTypes from '../constants';
import {scheduleWorkToRoot} from "./scheduleWork";
import {IRoot} from "../../typing";

export class Root {
    tag: symbol;
    type: any;
    node: HTMLElement | null;
    props: IRoot["props"];

    constructor(
        rootProps: IRoot
    ) {
        const {
            tag,
            node,
            props,
            type,
        } = rootProps
        this.tag = tag;
        this.type = type;
        this.node = node as HTMLElement;
        this.props = props;
    }
}

function render(element: ReactElement, container: HTMLElement) {
    const fiberRoot = new Root({
        tag: ReaxTypes.ROOT,
        type: "",
        node: container as HTMLElement,
        props: {children: [element]}
    });
    scheduleWorkToRoot(fiberRoot)
}


export default {
    render
}