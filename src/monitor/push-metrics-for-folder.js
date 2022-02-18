#!/usr/bin/env node

/**
 * This script uses previously computed metrics in JSON format for ONE folder to
 * produce a text payload and pushes it to Prometheus PushGateway
 *
 * Metrics are expected to be found at project root, in:
 * - coverage-artifacts/coverageStats_${folderName}.json (from jest coverage reporters)
 * - coverage-artifacts/testStats_${folderName}.json (from custom jest test reporter)
 */

const path = require("path")

const { MAX_ATTEMPTS, RETRY_DELAY } = require('./constants')
const { getMetricsList } = require('./metrics-list.js')
const { formatMetricPayload } = require('./format-metric-payload.js')
const { pushToGateway } = require('./push-to-pushgateway.js')

const pushMetricsForFolder = ({ coverageArtifactsPath, folderName, jobName, pushGatewayUri }) => {
    // Extract stats for folder from JSON files
    let coverageStats
    let testStats
    try {
        coverageStats = require(`${coverageArtifactsPath}/coverageStats_${folderName}.json`).total
        testStats = require(`${coverageArtifactsPath}/testStats_${folderName}.json`)
    }
    catch(e) {
        throw new Error(`Error importing stats: ${e.message}`)
    }

    // Exit if no stats were found
    if (!coverageStats || !testStats) {
        throw new Error(`No stats found for folder ${folderName}.`)
    }

    // Build text payload that will be sent to Prometheus
    const metricsPayload = getMetricsList(testStats, coverageStats)
        .reduce((metricsAsText, metric) => metricsAsText + formatMetricPayload(metric), "")

    // Sent metrics to Prometheus - try MAX_ATTEMPTS times
    const pushAttempt = (attemptsCount) => {
        console.log(`Push metrics attempt #${attemptsCount}...`)
        pushToGateway(`${pushGatewayUri}/metrics/job/${jobName}/folder_name/${folderName}`, metricsPayload, (err, data) => {
            if (err) {
                if (attemptsCount < MAX_ATTEMPTS) {
                    console.error("Failed to push metrics:", err.message, ` - will retry in ${RETRY_DELAY}ms...`)
                    // Wait and retry
                    setTimeout(() => pushAttempt(attemptsCount + 1), RETRY_DELAY)
                }
                else {
                    throw err
                }
            }
            else {
                console.log("Done -", data.body)
            }
        })
    }

    pushAttempt(0)
}

// If script is used from command-line as standalone
if (require.main === module) {
    let [ coverageArtifactsPath, folderName, jobName, pushGatewayUri ] = process.argv.slice(2)
    pushMetricsForFolder(
        {
            coverageArtifactsPath,
            folderName,
            jobName,
            pushGatewayUri
        }
    )
}

module.exports = {
    pushMetricsForFolder,
}
