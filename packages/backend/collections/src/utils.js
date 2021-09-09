
const fieldsToJSON = (fields) => {
    let newObj = {};

    for (const i in fields) {
        let a = i.match(/([^\[\]]+)(\[[^\[\]]+[^\]])*?/g),
            p = fields[i];
            j = a.length;
        while (j--) {
            q = {};
            q[a[j]] = p;
            p = q;
        }
        // merge object
        let k = Object.keys(p)[0],
            o = newObj;
    
        while (k in o) {
            p = p[k];
            o = o[k];
            k = Object.keys(p)[0];
        }
    
        o[k] = p[k];
    }

    return newObj
}

module.exports = { 
    fieldsToJSON
}
