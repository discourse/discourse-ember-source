function buildProgram(b, content, loc) {
    return b.program([buildStatement(b, content, loc)], undefined, loc);
}
function buildStatement(b, content, loc) {
    switch (content.type) {
        case 'PathExpression':
            return b.mustache(content, undefined, undefined, undefined, loc);
        case 'SubExpression':
            return b.mustache(content.path, content.params, content.hash, undefined, loc);
        // The default case handles literals.
        default:
            return b.text(`${content.value}`, loc);
    }
}
function unsafeHtml(b, expr) {
    return b.sexpr('-html-safe', [expr]);
}
export default function transformInlineLinkTo(env) {
    let { builders: b } = env.syntax;
    return {
        name: 'transform-inline-link-to',
        visitor: {
            MustacheStatement(node) {
                if (node.path.original === 'link-to') {
                    let content = node.escaped ? node.params[0] : unsafeHtml(b, node.params[0]);
                    return b.block('link-to', node.params.slice(1), node.hash, buildProgram(b, content, node.loc), null, node.loc);
                }
            },
        },
    };
}
