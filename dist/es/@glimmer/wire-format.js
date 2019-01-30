var Opcodes;
(function (Opcodes) {
    // Statements
    Opcodes[Opcodes["Text"] = 0] = "Text";
    Opcodes[Opcodes["Append"] = 1] = "Append";
    Opcodes[Opcodes["Comment"] = 2] = "Comment";
    Opcodes[Opcodes["Modifier"] = 3] = "Modifier";
    Opcodes[Opcodes["Block"] = 4] = "Block";
    Opcodes[Opcodes["Component"] = 5] = "Component";
    Opcodes[Opcodes["DynamicComponent"] = 6] = "DynamicComponent";
    Opcodes[Opcodes["OpenElement"] = 7] = "OpenElement";
    Opcodes[Opcodes["OpenSplattedElement"] = 8] = "OpenSplattedElement";
    Opcodes[Opcodes["FlushElement"] = 9] = "FlushElement";
    Opcodes[Opcodes["CloseElement"] = 10] = "CloseElement";
    Opcodes[Opcodes["StaticAttr"] = 11] = "StaticAttr";
    Opcodes[Opcodes["DynamicAttr"] = 12] = "DynamicAttr";
    Opcodes[Opcodes["AttrSplat"] = 13] = "AttrSplat";
    Opcodes[Opcodes["Yield"] = 14] = "Yield";
    Opcodes[Opcodes["Partial"] = 15] = "Partial";
    Opcodes[Opcodes["DynamicArg"] = 16] = "DynamicArg";
    Opcodes[Opcodes["StaticArg"] = 17] = "StaticArg";
    Opcodes[Opcodes["TrustingAttr"] = 18] = "TrustingAttr";
    Opcodes[Opcodes["Debugger"] = 19] = "Debugger";
    Opcodes[Opcodes["ClientSideStatement"] = 20] = "ClientSideStatement";
    // Expressions
    Opcodes[Opcodes["Unknown"] = 21] = "Unknown";
    Opcodes[Opcodes["Get"] = 22] = "Get";
    Opcodes[Opcodes["MaybeLocal"] = 23] = "MaybeLocal";
    Opcodes[Opcodes["HasBlock"] = 24] = "HasBlock";
    Opcodes[Opcodes["HasBlockParams"] = 25] = "HasBlockParams";
    Opcodes[Opcodes["Undefined"] = 26] = "Undefined";
    Opcodes[Opcodes["Helper"] = 27] = "Helper";
    Opcodes[Opcodes["Concat"] = 28] = "Concat";
    Opcodes[Opcodes["ClientSideExpression"] = 29] = "ClientSideExpression";
})(Opcodes || (Opcodes = {}));

function is(variant) {
    return function (value) {
        return Array.isArray(value) && value[0] === variant;
    };
}
// Statements
const isFlushElement = is(Opcodes.FlushElement);
const isAttrSplat = is(Opcodes.AttrSplat);
function isAttribute(val) {
    return val[0] === Opcodes.StaticAttr || val[0] === Opcodes.DynamicAttr || val[0] === Opcodes.TrustingAttr;
}
function isArgument(val) {
    return val[0] === Opcodes.StaticArg || val[0] === Opcodes.DynamicArg;
}
// Expressions
const isGet = is(Opcodes.Get);
const isMaybeLocal = is(Opcodes.MaybeLocal);

export { is, isFlushElement, isAttrSplat, isAttribute, isArgument, isGet, isMaybeLocal, Opcodes as Ops };
