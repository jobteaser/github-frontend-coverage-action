#!/usr/bin/env node

/**
 * This script returns the list of metrics used for coverage monitoring.
 * It expects to receive test and coverage stats as JS hash.
 */

const getValidPercentage = value => value === "Unknown" ? 0 : value

const getMetricsList = (testStats, coverageStats) => {
    return [
        {
            metricName: `testSuites_total`,
            metricValue: testStats.numTotalTestSuites,
            metricType: "gauge",
            metricHelp: "Total of test suites for folder",
        },
        {
            metricName: `testSuitesPassed_total`,
            metricValue: testStats.numPassedTestSuites,
            metricType: "gauge",
            metricHelp: "Total of test suites that passed for folder",
        },
        {
            metricName: `testSuitesFailed_total`,
            metricValue: testStats.numFailedTestSuites,
            metricType: "gauge",
            metricHelp: "Total of test suites that failed for folder",
        },
        {
            metricName: `testSuitesSkipped_total`,
            metricValue: testStats.numPendingTestSuites,
            metricType: "gauge",
            metricHelp: "Total of test suites that were skipped for folder",
        },
        {
            metricName: `tests_total`,
            metricValue: testStats.numTotalTests,
            metricType: "gauge",
            metricHelp: "Total of tests for folder",
        },
        {
            metricName: `testsPassed_total`,
            metricValue: testStats.numPassedTests,
            metricType: "gauge",
            metricHelp: "Total of tests that passed for folder",
        },
        {
            metricName: `testsSkipped_total`,
            metricValue: testStats.numPendingTests,
            metricType: "gauge",
            metricHelp: "Total of tests that were skipped for folder",
        },
        {
            metricName: `testsFailed_total`,
            metricValue: testStats.numFailedTests,
            metricType: "gauge",
            metricHelp: "Total of tests that failed for folder",
        },
        {
            metricName: `snapshots_total`,
            metricValue: testStats.snapshot.total,
            metricType: "gauge",
            metricHelp: "Total of snapshots for folder",
        },
        {
            metricName: `duration_total`,
            metricValue: (testStats.endTime - testStats.startTime)/1000,
            metricType: "gauge",
            metricHelp: "Total of time taken to run tests for folder",
        },
        {
            metricName: `lines_percent`,
            metricValue: getValidPercentage(coverageStats.lines.pct),
            metricType: "gauge",
            metricHelp: "Percent of lines covered for folder",
        },
        {
            metricName: `statements_percent`,
            metricValue: getValidPercentage(coverageStats.statements.pct),
            metricType: "gauge",
            metricHelp: "Percent of statements covered for folder",
        },
        {
            metricName: `functions_percent`,
            metricValue: getValidPercentage(coverageStats.functions.pct),
            metricType: "gauge",
            metricHelp: "Percent of functions covered for folder",
        },
        {
            metricName: `branches_percent`,
            metricValue: getValidPercentage(coverageStats.branches.pct),
            metricType: "gauge",
            metricHelp: "Percent of branches covered for folder",
        },
    ]
}

module.exports = {
    getMetricsList,
}
