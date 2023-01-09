const path = require('path')
const rails = require('esbuild-rails')
const { default: importGlob } = require('esbuild-plugin-import-glob')
const aliasPlugin = require('esbuild-plugin-path-alias')
const { sassPlugin } = require('esbuild-sass-plugin')
const railsEnv = process.env.RAILS_ENV || 'development'
const optimize = railsEnv !== 'development'
const watch = process.argv.includes('--watch') && {
  onRebuild(error) {
    if (error) console.error('[watch] build failed', error);
    else console.log('[watch] build finished');
  },
};

require('esbuild').build({
  entryPoints: ['application.js'],
  bundle: true,
  outdir: path.join(process.cwd(), 'app/assets/builds'),
  absWorkingDir: path.join(process.cwd(), 'app/javascript'),
  color: true,
  minify: optimize,
  watch: watch,
  allowOverwrite: true,
  sourcemap: !optimize,
  loader: { '.js': 'jsx' },
  preserveSymlinks: true,
  plugins: [
    rails(),
    importGlob(),
    sassPlugin({ type: 'css' }),
    aliasPlugin({
      'helpers/*': path.resolve(__dirname, './app/javascript/helpers/') 
    })
  ],
}).catch(() => process.exit(1));
