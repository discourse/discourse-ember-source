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
    Opcodes[Opcodes["ComponentAttr"] = 13] = "ComponentAttr";
    Opcodes[Opcodes["AttrSplat"] = 14] = "AttrSplat";
    Opcodes[Opcodes["Yield"] = 15] = "Yield";
    Opcodes[Opcodes["Partial"] = 16] = "Partial";
    Opcodes[Opcodes["DynamicArg"] = 17] = "DynamicArg";
    Opcodes[Opcodes["StaticArg"] = 18] = "StaticArg";
    Opcodes[Opcodes["TrustingAttr"] = 19] = "TrustingAttr";
    Opcodes[Opcodes["TrustingComponentAttr"] = 20] = "TrustingComponentAttr";
    Opcodes[Opcodes["Debugger"] = 21] = "Debugger";
    Opcodes[Opcodes["ClientSideStatement"] = 22] = "ClientSideStatement";
    // Expressions
    Opcodes[Opcodes["Unknown"] = 23] = "Unknown";
    Opcodes[Opcodes["Get"] = 24] = "Get";
    Opcodes[Opcodes["MaybeLocal"] = 25] = "MaybeLocal";
    Opcodes[Opcodes["HasBlock"] = 26] = "HasBlock";
    Opcodes[Opcodes["HasBlockParams"] = 27] = "HasBlockParams";
    Opcodes[Opcodes["Undefined"] = 28] = "Undefined";
    Opcodes[Opcodes["Helper"] = 29] = "Helper";
    Opcodes[Opcodes["Concat"] = 30] = "Concat";
    Opcodes[Opcodes["ClientSideExpression"] = 31] = "ClientSideExpression";
})(Opcodes || (Opcodes = {}));

function is(variant) {
    return function (value) {
        return Array.isArray(value) && value[0] === variant;
    };
}
// Statements
const isFlushElement = is(Opcodes.FlushElement);
function isAttribute(val) {
    return val[0] === Opcodes.StaticAttr || val[0] === Opcodes.DynamicAttr || val[0] === Opcodes.ComponentAttr || val[0] === Opcodes.TrustingAttr || val[0] === Opcodes.TrustingComponentAttr || val[0] === Opcodes.AttrSplat;
}
function isArgument(val) {
    return val[0] === Opcodes.StaticArg || val[0] === Opcodes.DynamicArg;
}
// Expressions
const isGet = is(Opcodes.Get);
const isMaybeLocal = is(Opcodes.MaybeLocal);

export { is, isFlushElement, isAttribute, isArgument, isGet, isMaybeLocal, Opcodes as Ops };
