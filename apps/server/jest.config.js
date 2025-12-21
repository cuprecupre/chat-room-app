module.exports = {
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.js"],
    verbose: true,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/index.js",
        "!src/**/__tests__/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
};
