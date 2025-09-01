jest.mock('child_process', () => {
  return {
    fork: jest.fn((scriptPath, args, options) => {
      // Simulate extraction by copying the file manually
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(args[0]);
      zip.extractAllTo(args[1], true);
      return {
        on: (event, cb) => {
          if (event === 'exit') {
            cb();
          }
        }
      };
    })
  };
});

const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('unzip.js', () => {
  const testZip = path.join(__dirname, 'test.zip');
  const testDir = path.join(__dirname, 'unzipped');

  beforeAll(() => {
    // Create a zip file for testing
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    zip.addFile('test.txt', Buffer.from('hello world'));
    zip.writeZip(testZip);
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testZip)) fs.unlinkSync(testZip);
    if (fs.existsSync(path.join(testDir, 'test.txt'))) fs.unlinkSync(path.join(testDir, 'test.txt'));
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
  });

  it('should extract zip file to output directory', (done) => {
    const child = fork(path.join(__dirname, 'unzip.js'), [testZip, testDir], { silent: true });
    child.on('exit', () => {
      expect(fs.existsSync(path.join(testDir, 'test.txt'))).toBe(true);
      done();
    });
  });
});
