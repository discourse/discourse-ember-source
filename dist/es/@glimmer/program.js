import '@glimmer/util';

const UNRESOLVED = {};
const WELL_KNOWN_EMPTY_ARRAY_POSITION = 0;
const WELL_KNOW_EMPTY_ARRAY = Object.freeze([]);
class WriteOnlyConstants {
    constructor() {
        // `0` means NULL
        this.strings = [];
        this.arrays = [WELL_KNOW_EMPTY_ARRAY];
        this.tables = [];
        this.handles = [];
        this.resolved = [];
        this.numbers = [];
    }
    string(value) {
        let index = this.strings.indexOf(value);
        if (index > -1) {
            return index;
        }
        return this.strings.push(value) - 1;
    }
    stringArray(strings) {
        let _strings = new Array(strings.length);
        for (let i = 0; i < strings.length; i++) {
            _strings[i] = this.string(strings[i]);
        }
        return this.array(_strings);
    }
    array(values) {
        if (values.length === 0) {
            return WELL_KNOWN_EMPTY_ARRAY_POSITION;
        }
        let index = this.arrays.indexOf(values);
        if (index > -1) {
            return index;
        }
        return this.arrays.push(values) - 1;
    }
    handle(handle) {
        let index = this.handles.indexOf(handle);
        if (index > -1) {
            return index;
        }
        this.resolved.push(UNRESOLVED);
        return this.handles.push(handle) - 1;
    }
    serializable(value) {
        let str = JSON.stringify(value);
        let index = this.strings.indexOf(str);
        if (index > -1) {
            return index;
        }
        return this.strings.push(str) - 1;
    }
    number(number) {
        let index = this.numbers.indexOf(number);
        if (index > -1) {
            return index;
        }
        return this.numbers.push(number) - 1;
    }
    toPool() {
        return {
            strings: this.strings,
            arrays: this.arrays,
            handles: this.handles,
            numbers: this.numbers
        };
    }
}
class RuntimeConstants {
    constructor(resolver, pool) {
        this.resolver = resolver;
        this.strings = pool.strings;
        this.arrays = pool.arrays;
        this.handles = pool.handles;
        this.resolved = this.handles.map(() => UNRESOLVED);
        this.numbers = pool.numbers;
    }
    getString(value) {
        return this.strings[value];
    }
    getNumber(value) {
        return this.numbers[value];
    }
    getStringArray(value) {
        let names = this.getArray(value);
        let _names = new Array(names.length);
        for (let i = 0; i < names.length; i++) {
            let n = names[i];
            _names[i] = this.getString(n);
        }
        return _names;
    }
    getArray(value) {
        return this.arrays[value];
    }
    resolveHandle(index) {
        let resolved = this.resolved[index];
        if (resolved === UNRESOLVED) {
            let handle = this.handles[index];
            resolved = this.resolved[index] = this.resolver.resolve(handle);
        }
        return resolved;
    }
    getSerializable(s) {
        return JSON.parse(this.strings[s]);
    }
}
class Constants extends WriteOnlyConstants {
    constructor(resolver, pool) {
        super();
        this.resolver = resolver;
        if (pool) {
            this.strings = pool.strings;
            this.arrays = pool.arrays;
            this.handles = pool.handles;
            this.resolved = this.handles.map(() => UNRESOLVED);
            this.numbers = pool.numbers;
        }
    }
    getNumber(value) {
        return this.numbers[value];
    }
    getString(value) {
        return this.strings[value];
    }
    getStringArray(value) {
        let names = this.getArray(value);
        let _names = new Array(names.length);
        for (let i = 0; i < names.length; i++) {
            let n = names[i];
            _names[i] = this.getString(n);
        }
        return _names;
    }
    getArray(value) {
        return this.arrays[value];
    }
    resolveHandle(index) {
        let resolved = this.resolved[index];
        if (resolved === UNRESOLVED) {
            let handle = this.handles[index];
            resolved = this.resolved[index] = this.resolver.resolve(handle);
        }
        return resolved;
    }
    getSerializable(s) {
        return JSON.parse(this.strings[s]);
    }
}
class LazyConstants extends Constants {
    constructor() {
        super(...arguments);
        this.others = [];
        this.serializables = [];
    }
    serializable(value) {
        let index = this.serializables.indexOf(value);
        if (index > -1) {
            return index;
        }
        return this.serializables.push(value) - 1;
    }
    getSerializable(s) {
        return this.serializables[s];
    }
    getOther(value) {
        return this.others[value - 1];
    }
    other(other) {
        return this.others.push(other);
    }
}

class Opcode {
    constructor(heap) {
        this.heap = heap;
        this.offset = 0;
    }
    get size() {
        let rawType = this.heap.getbyaddr(this.offset);
        return ((rawType & 768 /* OPERAND_LEN_MASK */) >> 8 /* ARG_SHIFT */) + 1;
    }
    get isMachine() {
        let rawType = this.heap.getbyaddr(this.offset);
        return rawType & 1024 /* MACHINE_MASK */;
    }
    get type() {
        return this.heap.getbyaddr(this.offset) & 255 /* TYPE_MASK */;
    }
    get op1() {
        return this.heap.getbyaddr(this.offset + 1);
    }
    get op2() {
        return this.heap.getbyaddr(this.offset + 2);
    }
    get op3() {
        return this.heap.getbyaddr(this.offset + 3);
    }
}

function encodeTableInfo(scopeSize, state) {

    return state | scopeSize << 2;
}
function changeState(info, newState) {

    return info | newState << 30;
}
const PAGE_SIZE = 0x100000;
/**
 * The Heap is responsible for dynamically allocating
 * memory in which we read/write the VM's instructions
 * from/to. When we malloc we pass out a VMHandle, which
 * is used as an indirect way of accessing the memory during
 * execution of the VM. Internally we track the different
 * regions of the memory in an int array known as the table.
 *
 * The table 32-bit aligned and has the following layout:
 *
 * | ... | hp (u32) |       info (u32)   | size (u32) |
 * | ... |  Handle  | Scope Size | State | Size       |
 * | ... | 32bits   | 30bits     | 2bits | 32bit      |
 *
 * With this information we effectively have the ability to
 * control when we want to free memory. That being said you
 * can not free during execution as raw address are only
 * valid during the execution. This means you cannot close
 * over them as you will have a bad memory access exception.
 */
class Heap {
    constructor(serializedHeap) {
        this.placeholders = [];
        this.offset = 0;
        this.handle = 0;
        this.capacity = PAGE_SIZE;
        if (serializedHeap) {
            let { buffer, table, handle } = serializedHeap;
            this.heap = new Uint32Array(buffer);
            this.table = table;
            this.offset = this.heap.length;
            this.handle = handle;
            this.capacity = 0;
        } else {
            this.heap = new Uint32Array(PAGE_SIZE);
            this.table = [];
        }
    }
    push(item) {
        this.sizeCheck();
        this.heap[this.offset++] = item;
    }
    sizeCheck() {
        if (this.capacity === 0) {
            let heap = slice(this.heap, 0, this.offset);
            this.heap = new Uint32Array(heap.length + PAGE_SIZE);
            this.heap.set(heap, 0);
            this.capacity = PAGE_SIZE;
        }
        this.capacity--;
    }
    getbyaddr(address) {
        return this.heap[address];
    }
    setbyaddr(address, value) {
        this.heap[address] = value;
    }
    malloc() {
        // push offset, info, size
        this.table.push(this.offset, 0, 0);
        let handle = this.handle;
        this.handle += 3 /* ENTRY_SIZE */;
        return handle;
    }
    finishMalloc(handle, scopeSize) {
        this.table[handle + 1 /* INFO_OFFSET */] = encodeTableInfo(scopeSize, 0 /* Allocated */);
    }
    size() {
        return this.offset;
    }
    // It is illegal to close over this address, as compaction
    // may move it. However, it is legal to use this address
    // multiple times between compactions.
    getaddr(handle) {
        return this.table[handle];
    }
    gethandle(address) {
        this.table.push(address, encodeTableInfo(0, 3 /* Pointer */), 0);
        let handle = this.handle;
        this.handle += 3 /* ENTRY_SIZE */;
        return handle;
    }
    sizeof(handle) {
        return -1;
    }
    scopesizeof(handle) {
        let info = this.table[handle + 1 /* INFO_OFFSET */];
        return info >> 2;
    }
    free(handle) {
        let info = this.table[handle + 1 /* INFO_OFFSET */];
        this.table[handle + 1 /* INFO_OFFSET */] = changeState(info, 1 /* Freed */);
    }
    pushPlaceholder(valueFunc) {
        this.sizeCheck();
        let address = this.offset++;
        this.heap[address] = 2147483647 /* MAX_SIZE */;
        this.placeholders.push([address, valueFunc]);
    }
    patchPlaceholders() {
        let { placeholders } = this;
        for (let i = 0; i < placeholders.length; i++) {
            let [address, getValue] = placeholders[i];

            this.setbyaddr(address, getValue());
        }
    }
    capture(offset = this.offset) {
        this.patchPlaceholders();
        // Only called in eager mode
        let buffer = slice(this.heap, 0, offset).buffer;
        return {
            handle: this.handle,
            table: this.table,
            buffer: buffer
        };
    }
}
class WriteOnlyProgram {
    constructor(constants = new WriteOnlyConstants(), heap = new Heap()) {
        this.constants = constants;
        this.heap = heap;
        this._opcode = new Opcode(this.heap);
    }
    opcode(offset) {
        this._opcode.offset = offset;
        return this._opcode;
    }
}
class RuntimeProgram {
    constructor(constants, heap) {
        this.constants = constants;
        this.heap = heap;
        this._opcode = new Opcode(this.heap);
    }
    static hydrate(rawHeap, pool, resolver) {
        let heap = new Heap(rawHeap);
        let constants = new RuntimeConstants(resolver, pool);
        return new RuntimeProgram(constants, heap);
    }
    opcode(offset) {
        this._opcode.offset = offset;
        return this._opcode;
    }
}
class Program extends WriteOnlyProgram {}
function slice(arr, start, end) {
    if (arr.slice !== undefined) {
        return arr.slice(start, end);
    }
    let ret = new Uint32Array(end);
    for (; start < end; start++) {
        ret[start] = arr[start];
    }
    return ret;
}

export { WELL_KNOWN_EMPTY_ARRAY_POSITION, WriteOnlyConstants, RuntimeConstants, Constants, LazyConstants, Heap, WriteOnlyProgram, RuntimeProgram, Program, Opcode };
