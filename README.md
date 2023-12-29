To run npm run watch
then npm run dev

if want to run test cases
make a new file named jest.config.js
/\*_ @type {import('ts-jest').JestConfigWithTsJest} _/
module.exports = {
preset: 'ts-jest/presets/js-with-ts',
testEnvironment: "node",
}
copy paste above lines
then run npm test filename
