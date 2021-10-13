import typescript from 'rollup-plugin-typescript';
import babel from 'rollup-plugin-babel';
import {eslint} from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import uglify from '@lopatnov/rollup-plugin-uglify';
import hotreload from './hot/index';

export default [{
  input: './src/index.tsx',
  output: {
    file: './build/bundle.js',
    format: 'iife',
    sourcemap: true,
  },
  external: ['Immutable'],

  plugins: [
    babel(),
    eslint({
      include: ['src/**/*.ts'],
      exclude: ['node_modules/**'],
    }),
    typescript(),
    resolve(),
    // uglify(),
    hotreload(),
  ],
}, {
  input: './hot/emit.js',
  output: {
    file: './build/emit.js',
    format: 'cjs',
    sourcemap: false,
    exports: 'default',
  },

  plugins: [
    babel(),
    uglify(),
  ],
}];
