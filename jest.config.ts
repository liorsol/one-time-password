import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": ["ts-jest", { diagnostics: false }],
  },
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
};

export default config;
