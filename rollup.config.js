import serve from 'rollup-plugin-serve';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/umd/bundle.js',
    format: 'umd',
    name: 'Vue',
    sourcemap: true,
  },
  plugins: [
    process.env.ENV === 'development'
      ? serve({
          openPage: '/public/index.html',
          port: 7000,
          contentBase: '',
        })
      : null,
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
