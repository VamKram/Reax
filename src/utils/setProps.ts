export default (dom: any, op: any, np: any) => {
    for (const oKey in op) {
        if (oKey !== 'children') {
            if (np.hasOwnProperty(oKey)) {
                setProp(dom, oKey, np[oKey])
            } else {
                dom.removeAttribute(oKey);
            }
        }
    }

    for (const nKey in np) {
        if (nKey !== 'children') {
            if (!op.hasOwnProperty(nKey)) {
                setProp(dom, nKey, np[nKey]);
            }
        }
    }
}

function setProp(dom: any, key: string, value: any) {
    if (/^on/.test(key)) dom[key.toLocaleLowerCase()] = value;
    if (key === 'style') {
        for (const styleName in value) {
            dom.style[styleName] = value[styleName];
        }
    }
    dom.setAttribute(key, value);
}