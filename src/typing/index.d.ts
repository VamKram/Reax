import * as React from "react";
import {ReactElement} from "react";
import {Component, UpdateQueue} from '../lib/element';


export interface Fiber {
    root?: null;
    child?: IRoot;
    sibling?: IRoot;
    return?: IRoot;
    firstEffect?: IRoot | null,
    lastEffect?: IRoot | null,
    nextEffect?: IRoot | null
}

export interface IRoot extends Fiber {
    tag: symbol;
    type: string | keyof HTMLMapElement | Component<any> | Function;
    props: {
        children: ReactElement[],
        text?: string
    } & { [K in string]: any },
    node: null | HTMLElement | Component;
    return?: IRoot,
    alternate?: IRoot,
    hooks?: any
    effectTag?: symbol | null,
    updateQueue?: UpdateQueue
}

type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
    timeout: number;
};
type RequestIdleCallbackDeadline = {
    readonly didTimeout: boolean;
    timeRemaining: (() => number);
};

declare global {
    interface Window {
        requestIdleCallback: ((
            callback: ((deadline: RequestIdleCallbackDeadline) => void),
            opts?: RequestIdleCallbackOptions,
        ) => RequestIdleCallbackHandle);
        cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
    }
}

export type Reax = typeof React;

export type CreateElement = typeof React.createElement;
export type CreateElementParams = Parameters<CreateElement>;
export type RType = CreateElementParams[0];
export type RProps = CreateElementParams[1] | any;
export type RChild = CreateElementParams[2];


export type DataType = { type: string, key: string } & Fiber;

