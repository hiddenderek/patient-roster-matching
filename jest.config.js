/** @type {import('jest').Config} */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
