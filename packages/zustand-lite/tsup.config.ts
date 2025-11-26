import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vanilla: 'src/vanilla.ts',
    react: 'src/react.ts',
    'middleware/index': 'src/middleware/index.ts',
    'middleware/persist': 'src/middleware/persist.ts',
    'middleware/devtools': 'src/middleware/devtools.ts',
    'middleware/immer': 'src/middleware/immer.ts',
    'middleware/combine': 'src/middleware/combine.ts',
    'middleware/subscribeWithSelector': 'src/middleware/subscribeWithSelector.ts',
    'ssr/index': 'src/ssr/index.ts',
    'utils/shallow': 'src/utils/shallow.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'immer'],
  treeshake: true,
  minify: false,
})
