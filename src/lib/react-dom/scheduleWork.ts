import {IRoot, RequestIdleCallbackDeadline} from "../../typing";
import * as ReaxTypes from "../constants";
import {DELETION, ELEMENT_TEXT, NODE_CLASS, NODE_HOST, NODE_TEXT, ROOT, UPDATE} from "../constants";
import {ReactElement} from "react";
import setProps from "../../utils/setProps";
import {Component, UpdateQueue, Updater} from "../element";

let nextUnitOfWork: IRoot | null | undefined = null;
// double buffering
let workInProgressRoot: IRoot | null | undefined = null;

let currentRoot: IRoot | null | undefined = null;
// 删除的节点不放在effectlist中
let deletions: IRoot[] = [];

let workInProgressFiber: IRoot | null | undefined = null;
let hooksIndex = 0;

function createWorkInProgressRoot(fiber: IRoot) {
    workInProgressRoot = fiber
}

export function useReducer(reducer: Function | null, initState: any) {
    let oldHook = workInProgressFiber?.alternate
        && workInProgressFiber.alternate.hooks
        && workInProgressFiber.alternate.hooks[hooksIndex];
    let newHook = oldHook;
    if (oldHook) {
        oldHook.state = oldHook.updateQueue.forceUpdate(oldHook.state)
    } else {
        newHook = {
            state: initState,
            updateQueue: new UpdateQueue()
        }
    }
    const dispatch = (action: Function) => {
        newHook.updateQueue.enqueueUpdate(
            new Updater(reducer ? reducer(newHook.state, action) : action)
        );
        scheduleWorkToRoot();
    }

    (workInProgressFiber as IRoot).hooks[hooksIndex++] = newHook;
    return [newHook.state, dispatch];

}

export function useState(initState: any) {
    return useReducer(null, initState)
}


export function scheduleWorkToRoot(fiberRoot?: IRoot) {
    // 第二次的更新
    if (currentRoot && currentRoot.alternate) {
        workInProgressRoot = currentRoot.alternate;
        workInProgressRoot.alternate = currentRoot;
        if (fiberRoot) workInProgressRoot.props = fiberRoot.props;

        // 第一次更新
    } else if (currentRoot) {
        if (fiberRoot) {
            fiberRoot.alternate = currentRoot;
            workInProgressRoot = fiberRoot;
        } else {
            workInProgressRoot = {
                ...currentRoot,
                alternate: currentRoot,
            }
        }
    } else {
        workInProgressRoot = fiberRoot;
    }
    if (workInProgressRoot) {
        workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;
    }
    nextUnitOfWork = fiberRoot;
}


function commitWork(fiber: IRoot) {
    if (!fiber) return;
    let retFiber = fiber.return as IRoot;
    while (retFiber.tag !== NODE_HOST && retFiber.tag !== ROOT && retFiber.tag !== NODE_TEXT) {
        retFiber = retFiber.return as IRoot;
    }
    let retDOM = retFiber.node as HTMLElement;
    if (fiber.effectTag === ReaxTypes.PLACEMENT && retDOM) {
        let nextFiber = fiber;
        if (nextFiber.tag === NODE_CLASS) return;
        while (nextFiber.tag !== NODE_HOST && nextFiber.tag !== NODE_TEXT) {
            nextFiber = fiber.child as IRoot;
        }
        retDOM.appendChild(nextFiber.node as HTMLElement);
    }
    if (fiber.effectTag === ReaxTypes.DELETION && retDOM) {
        return commitDeletion(fiber, retDOM);
    }
    if (fiber.effectTag === ReaxTypes.UPDATE && retDOM) {
        if (fiber.type === ELEMENT_TEXT) {
            if (fiber.alternate?.props.text != fiber.props.text) {
                if (fiber.node) {
                    (fiber.node as HTMLElement).textContent = fiber.props.text as string;
                }
            }
        } else {
            if (fiber.tag === NODE_CLASS) {
                return
            }
            fiber.node && updateDOM((fiber.node as HTMLElement), fiber.alternate?.props || {} as IRoot["props"], fiber.props);
        }
    }
    fiber.effectTag = null;
}

function commitDeletion(fiber: IRoot, domRet: HTMLElement) {
    if (fiber.tag !== NODE_HOST && fiber.tag !== NODE_TEXT) {
        domRet.removeChild(fiber.node as HTMLElement)
    } else {
        commitDeletion(fiber.child as IRoot, domRet);
    }
}

function commitRoot() {
    deletions.forEach(commitWork);
    let fiber = workInProgressRoot?.firstEffect;
    while (fiber) {
        commitWork(fiber);
        fiber = fiber.nextEffect;
    }
    deletions.length = 0;
    currentRoot = workInProgressRoot;
    workInProgressRoot = null;
}

export function workLoop(deadline: RequestIdleCallbackDeadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork) {
        commitRoot();
    }
    window.requestIdleCallback(workLoop, {timeout: 500});
}

// 副作用收集
function completeUnitOfWork(nextUnitOfWork: IRoot) {
    let returnFiber = nextUnitOfWork.return;
    if (returnFiber) {
        if (!returnFiber.firstEffect) {
            returnFiber.firstEffect = nextUnitOfWork.firstEffect;
        }
        if (nextUnitOfWork.lastEffect) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = nextUnitOfWork.firstEffect;
            }
            returnFiber.lastEffect = nextUnitOfWork.lastEffect;
        }
        const effectTag = nextUnitOfWork.effectTag
        if (effectTag) {
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = nextUnitOfWork;
            } else {
                returnFiber.firstEffect = nextUnitOfWork;
            }
            returnFiber.lastEffect = nextUnitOfWork;
        }
    }
}

function performUnitOfWork(nextUnitOfWork: IRoot | null): any {
    beginWork(nextUnitOfWork as IRoot);
    if (nextUnitOfWork?.child) {
        return nextUnitOfWork.child;
    }
    while (nextUnitOfWork) {
        completeUnitOfWork(nextUnitOfWork);
        if (nextUnitOfWork.sibling) {
            return nextUnitOfWork.sibling;
        }
        nextUnitOfWork = nextUnitOfWork.return as IRoot;
    }
}

function reconcileChildren(fiber: IRoot, newChildren: ReactElement[]) {
    let newChildIndex: number = 0,
        prevSibling: IRoot = {} as IRoot,
        oldFiber = fiber.alternate && fiber.alternate.child;
    if (oldFiber) oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
    while (newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex],
            tag: symbol = Symbol(),
            newFiber: IRoot = {} as IRoot;
        const sameType: boolean = !!(oldFiber && newChild && oldFiber.type === newChild.type);
        if (newChild && typeof newChild === "function" && (newChild as any).type.prototype.isReactComponent) {
            tag = ReaxTypes.NODE_CLASS;
        } else if (newChild && typeof newChild === "function") {
            tag = ReaxTypes.NODE_FUNCTION;
        } else if (newChild?.type === ELEMENT_TEXT) {
            tag = ReaxTypes.NODE_TEXT;
        } else if (typeof newChild?.type === 'string') {
            tag = ReaxTypes.NODE_HOST;
        }
        // reuse
        if (sameType && oldFiber) {
            if (oldFiber.alternate) {
                newFiber = oldFiber.alternate;
                newFiber.props = newChild.props;
                newFiber.alternate = oldFiber;
                newFiber.effectTag = UPDATE;
                newFiber.nextEffect = null;
                newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue();
            } else {
                newFiber = {
                    tag: oldFiber.tag,
                    type: oldFiber.type as string,
                    props: newChild.props,
                    node: oldFiber.node,
                    return: fiber,
                    alternate: oldFiber,
                    effectTag: ReaxTypes.UPDATE,
                    nextEffect: null,
                    updateQueue: oldFiber.updateQueue || new UpdateQueue()
                }
            }
        } else {
            if (newChild) {
                newFiber = {
                    tag,
                    updateQueue: new UpdateQueue(),
                    type: newChild.type as string,
                    props: newChild.props,
                    node: null,
                    return: fiber,
                    effectTag: ReaxTypes.PLACEMENT,
                    nextEffect: null
                }
            }

            if (oldFiber) {
                oldFiber.effectTag = DELETION;
                deletions.push(oldFiber);
            }
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (newChildIndex === 0) {
            fiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        newChildIndex++;
    }
}


function updateHostRoot(fiber: IRoot) {
    let newChildren = fiber.props.children;
    reconcileChildren(fiber, newChildren);
}

function updateDOM(stateNode: HTMLElement, oldProps: IRoot["props"], newProps: IRoot["props"]) {
    setProps(stateNode, oldProps, newProps);
}

function createDOM(fiber: IRoot): HTMLElement | null {
    if (fiber.tag === ReaxTypes.NODE_TEXT) {
        return document.createTextNode(fiber.props?.text || "") as any;
    }
    if (fiber.tag === ReaxTypes.NODE_HOST) {
        let stateNode = document.createElement(fiber.type as keyof HTMLElementTagNameMap);
        updateDOM(stateNode, {} as any, fiber.props);
        return stateNode;
    }
    return null;
}

function updateHostText(fiber: IRoot) {
    if (!fiber.node) {
        fiber.node = createDOM(fiber)
    }
}

function updateHost(fiber: IRoot) {
    if (!fiber.node) {
        fiber.node = createDOM(fiber)
    }
    const newChildren = fiber.props.children;
    reconcileChildren(fiber, newChildren);
}

function isComp(node: any): node is Component {
    return node instanceof Component;
}

function updateClassComp(fiber: IRoot) {
    //组件实例
    if (!fiber.node) {
        fiber.node = new (fiber.type as any)(fiber.props) as Component;
        fiber.node.internalFiber = fiber;
        fiber.updateQueue = new UpdateQueue();
    }

    if (!isComp(fiber.node)) {
        return
    }
    fiber.node.state = fiber.updateQueue?.forceUpdate(fiber.node.state);
    const newElement = fiber.node.render(),
        newChildren = [newElement];
    reconcileChildren(fiber, newChildren);

}

function updateFunctionComp(fiber: IRoot) {
    workInProgressFiber = fiber;
    hooksIndex = 0;
    workInProgressFiber.hooks = [];
    const newChildren = [(fiber.type as Function)(fiber.props)];
    reconcileChildren(fiber, newChildren);

}

/*
* create dom
* */
function beginWork(fiber: IRoot) {
    if (fiber.tag === ReaxTypes.ROOT) {
        updateHostRoot(fiber);
    } else if (fiber.tag === ReaxTypes.NODE_TEXT) {
        updateHostText(fiber);
    } else if (fiber.tag === ReaxTypes.NODE_HOST) {
        updateHost(fiber);
    } else if (fiber.tag === ReaxTypes.NODE_CLASS) {
        updateClassComp(fiber)
    } else if (fiber.tag === ReaxTypes.NODE_FUNCTION) {
        updateFunctionComp(fiber)
    }
}

window.requestIdleCallback(workLoop, {timeout: 500})