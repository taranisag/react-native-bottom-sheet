const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const packages = path.resolve(root, 'packages');

const workspaces = fs
  // List all packages under `packages/`
  .readdirSync(packages)
  // Ignore hidden files such as .DS_Store
  .filter(p => !p.startsWith('.'))
  .map(p => path.join(packages, p));

const modules = ['@babel/runtime']
  .concat(
    ...workspaces.map(it => {
      const pak = JSON.parse(
        fs.readFileSync(path.join(it, 'package.json'), 'utf8')
      );

      const deps = [];

      if (pak.dependencies) {
        deps.push(...Object.keys(pak.dependencies));
      }

      if (pak.peerDependencies) {
        deps.push(...Object.keys(pak.peerDependencies));
      }

      // We need to make sure that only one version is loaded for peerDependencies
      // So we blacklist them at the root, and alias them to the versions in example's node_modules
      return deps;
    })
  )
  .sort()
  .filter(
    (m, i, self) =>
      // Remove duplicates and package names of the packages in the monorepo
      self.lastIndexOf(m) === i && !m.startsWith('@gorhom/')
  )
  .reduce((paks, pak) => {
    paks[pak] = path.resolve(__dirname, 'node_modules', pak);
    return paks;
  }, {});

console.log(modules);

module.exports = api => {
  api.cache(true);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.ios.js', '.android.js'],
          alias: modules,
        },
      ],
    ],
  };
};
