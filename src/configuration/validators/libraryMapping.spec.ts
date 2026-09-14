import { lib } from './libraryMapping.js';
import { checkValidator } from './checkValidator.test.js';

checkValidator({
  validator: lib,
  option: {
    description: 'Library mapping',
    name: 'lib',
    type: 'library-mapping',
    multiple: true
  },
  valid: [
    {
      value: 'resources/my-lib=src/my-lib',
      expected: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 'src/my-lib' }
    },
    {
      value: 'my-lib',
      expected: { resourcesSubFolder: 'my-lib', sourceFolder: 'my-lib' }
    },
    {
      value: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 'src/my-lib' },
      expected: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 'src/my-lib' }
    }
  ],
  invalid: [
    { value: 'a=b=c' },
    { value: 123 },
    { value: true },
    { value: { resourcesSubFolder: 'resources/my-lib' } },
    { value: { sourceFolder: 'src/my-lib' } },
    { value: { resourcesSubFolder: 123, sourceFolder: 'src/my-lib' } },
    { value: { resourcesSubFolder: 'resources/my-lib', sourceFolder: 456 } }
  ]
});
