import {scheduleWorkToRoot} from "./react-dom/scheduleWork";

export class Component<S extends Object = {}, P extends any = {}> {
    isReactComponent = {};
    internalFiber: any = {};
    state: any = {};
    private updateQueue: UpdateQueue;

    constructor(public props: P) {
        this.props = props;
    }

    setState(payload: Created) {
        let updater = new Updater(payload);
        this.internalFiber.updateQueue.enqueueUpdate(updater);
        scheduleWorkToRoot();
    }

    render(): any {
    };
}


interface Created {
    payload: Function | Object;
    nextUpdate?: Created
}

export class Updater {
    constructor(public payload: Created) {
        this.payload = payload;
    }
}

export class UpdateQueue {
    private lastUpdate: null | Created;
    private firstUpdate: null | Created;

    constructor() {
        this.firstUpdate = null;
        this.lastUpdate = null;
    }

    enqueueUpdate(updated: Created) {
        if (this.lastUpdate === null) {
            this.firstUpdate = this.lastUpdate = updated;
        } else {
            this.lastUpdate.nextUpdate = updated;
            this.lastUpdate = updated;
        }
    }

    forceUpdate(state: any) {
        let currentUpdate = this.firstUpdate;
        while (currentUpdate) {
            let nextState = typeof currentUpdate.payload === 'function'
                ? currentUpdate.payload(state)
                : currentUpdate.payload;
            state = {...state, ...nextState};
            currentUpdate = currentUpdate.nextUpdate as Created;
        }
        this.firstUpdate = this.lastUpdate = null;
        return state;
    }
}

