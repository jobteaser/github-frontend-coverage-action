const { getMetricsList } = require("./metrics-list")

// As returned by jest JSON output
const testStats = {
    numTotalTestSuites: 1,
    numTotalTests: 2,
    snapshot: { total: 3 },
}
// As returned by `json-summary` coverage reporter
const coverageStats = {
    lines: { pct: 4 },
    statements: { pct: 5 },
    functions: { pct: 6 },
    branches: { pct: 7 },
}

describe("getMetricsList", () => {
    it("should be a function", () => {
        expect(typeof getMetricsList).toBe("function")
    })

    it("should return an array of specific structure for all metrics", () => {
        const res = getMetricsList(testStats, coverageStats)
        const validMetrics = [
            "testSuites_total",
            "testSuitesPassed_total",
            "testSuitesFailed_total",
            "testSuitesSkipped_total",
            "tests_total",
            "testsPassed_total",
            "testsSkipped_total",
            "testsFailed_total",
            "snapshots_total",
            "duration_total",
            "lines_percent",
            "statements_percent",
            "functions_percent",
            "branches_percent",
        ]
        res.forEach(metric => {
            expect(!!validMetrics.find(name => name === metric.metricName)).toBe(true)
            expect(typeof metric.metricValue).toBe("number")
            expect(metric.metricType).toBe("gauge")
        })
    })
})
