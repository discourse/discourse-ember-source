import { hasDOM } from '@ember/-internals/browser-environment';
import { privatize as P } from '@ember/-internals/container';
import { ENV } from '@ember/-internals/environment';
import { EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS } from '@ember/canary-features';
import Component from './component';
import Checkbox from './components/checkbox';
import Input from './components/input';
import LinkToComponent from './components/link-to';
import TextField from './components/text-field';
import TextArea from './components/textarea';
import { clientBuilder, DOMChanges, DOMTreeConstruction, NodeDOMTreeConstruction, rehydrationBuilder, serializeBuilder, } from './dom';
import Environment from './environment';
import loc from './helpers/loc';
import { InertRenderer, InteractiveRenderer } from './renderer';
import TemplateCompiler from './template-compiler';
import ComponentTemplate from './templates/component';
import InputTemplate from './templates/input';
import OutletTemplate from './templates/outlet';
import RootTemplate from './templates/root';
import OutletView from './views/outlet';
export function setupApplicationRegistry(registry) {
    registry.injection('service:-glimmer-environment', 'appendOperations', 'service:-dom-tree-construction');
    registry.injection('renderer', 'env', 'service:-glimmer-environment');
    // because we are using injections we can't use instantiate false
    // we need to use bind() to copy the function so factory for
    // association won't leak
    registry.register('service:-dom-builder', {
        create({ bootOptions }) {
            let { _renderMode } = bootOptions;
            switch (_renderMode) {
                case 'serialize':
                    return serializeBuilder.bind(null);
                case 'rehydrate':
                    return rehydrationBuilder.bind(null);
                default:
                    return clientBuilder.bind(null);
            }
        },
    });
    registry.injection('service:-dom-builder', 'bootOptions', '-environment:main');
    registry.injection('renderer', 'builder', 'service:-dom-builder');
    registry.register(P `template:-root`, RootTemplate);
    registry.injection('renderer', 'rootTemplate', P `template:-root`);
    registry.register('renderer:-dom', InteractiveRenderer);
    registry.register('renderer:-inert', InertRenderer);
    if (hasDOM) {
        registry.injection('service:-glimmer-environment', 'updateOperations', 'service:-dom-changes');
    }
    registry.register('service:-dom-changes', {
        create({ document }) {
            return new DOMChanges(document);
        },
    });
    registry.register('service:-dom-tree-construction', {
        create({ document }) {
            let Implementation = hasDOM ? DOMTreeConstruction : NodeDOMTreeConstruction;
            return new Implementation(document);
        },
    });
}
export function setupEngineRegistry(registry) {
    registry.register('view:-outlet', OutletView);
    registry.register('template:-outlet', OutletTemplate);
    registry.injection('view:-outlet', 'template', 'template:-outlet');
    registry.injection('service:-dom-changes', 'document', 'service:-document');
    registry.injection('service:-dom-tree-construction', 'document', 'service:-document');
    registry.register(P `template:components/-default`, ComponentTemplate);
    registry.register('service:-glimmer-environment', Environment);
    registry.register(P `template-compiler:main`, TemplateCompiler);
    registry.injection('template', 'compiler', P `template-compiler:main`);
    registry.optionsForType('helper', { instantiate: false });
    registry.register('helper:loc', loc);
    registry.register('component:-text-field', TextField);
    registry.register('component:-checkbox', Checkbox);
    registry.register('component:link-to', LinkToComponent);
    if (EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS) {
        registry.register('component:input', Input);
        registry.register('template:components/input', InputTemplate);
        registry.register('component:textarea', TextArea);
    }
    else {
        registry.register('component:-text-area', TextArea);
    }
    if (!ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
        registry.register(P `component:-default`, Component);
    }
}
