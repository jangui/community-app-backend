
const includesID = (id, array) => {
    id = id.toString();
    for (let i = 0; i < array.length; ++i) {
        if (array[i].toString() == id) { return true; }
    }
    return false;
}

exports.includesID = includesID;
