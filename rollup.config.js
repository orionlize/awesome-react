import typescript from 'rollup-plugin-typescript';
import babel from 'rollup-plugin-babel';
import {eslint} from 'rollup-plugin-eslint';
import hotreload from './hot/index'

export default {
  input: './src/index.ts',
  output: {
    file: './build/bundle.js',
    format: 'cjs',
    sourcemap: true,
  },

  plugins: [
    babel(),
    eslint({
      include: ['src/**/*.ts'],
      exclude: ['node_modules/**'],
    }),
    typescript(),
    hotreload()
  ],
}
;
