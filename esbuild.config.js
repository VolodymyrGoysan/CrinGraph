/* eslint-disable no-undef */

const path = require('path')
const rails = require('esbuild-rails')
const { default: importGlob } = require('esbuild-plugin-import-glob')
const { sassPlugin } = require('esbuild-sass-plugin')
const esbuild = require('esbuild')
const hq = require('alias-hq')

const railsEnv = process.env.RAILS_ENV || 'development'
const optimize = railsEnv !== 'development'
const watch = process.argv.includes('--watch')


function escapeStringRegexp(string) {
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d')
}

const mapAliasedPath = hq.get(({ rootUrl, baseUrl, paths }) => {
  return (importPath) => {
    if (!importPath.includes('@')) {
      return importPath
    }
    const basePath = path.join(rootUrl, baseUrl)
    for (const [aliasedPath, replacements] of Object.entries(paths)) {
      const regexp = new RegExp('(^|.*/)' + escapeStringRegexp(aliasedPath).replace('\\*', '(.*)'))
      importPath = importPath.replace(regexp, path.join(basePath, replacements[0]).replace('*', '$2'))
    }
    return importPath
  }
})

esbuild.build({
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
    sassPlugin({
      type: 'css',
      importMapper: mapAliasedPath,
    }),
  ],
}).catch(() => process.exit(1));
