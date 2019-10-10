import RuntimeResolver from './resolver';
// factory for DI
export default {
    create({ environment }) {
        return new RuntimeResolver(environment.isInteractive).compiler;
    },
};
