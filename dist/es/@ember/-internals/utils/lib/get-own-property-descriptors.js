let getOwnPropertyDescriptors;
if (Object.getOwnPropertyDescriptors !== undefined) {
    getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
}
else {
    getOwnPropertyDescriptors = function (obj) {
        let descriptors = {};
        Object.keys(obj).forEach(key => {
            descriptors[key] = Object.getOwnPropertyDescriptor(obj, key);
        });
        return descriptors;
    };
}
export default getOwnPropertyDescriptors;
