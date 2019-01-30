const AFTER_OBSERVERS = ':change';
export default function changeEvent(keyName) {
    return keyName + AFTER_OBSERVERS;
}
