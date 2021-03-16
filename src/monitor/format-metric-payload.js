#!/usr/bin/env node

/**
 * This script produces the text payload for one metric following Prometheus
 * text format:
 * https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format
 * It expects to receive metric as a JS hash.
 */

const formatMetricPayload = metric => {
    const { metricName, metricType, metricHelp, metricValue } = metric
    if (
        typeof metricName === "undefined" ||
        typeof metricType === "undefined" ||
        typeof metricHelp === "undefined" ||
        typeof metricValue === "undefined"
    ) {
        throw new Error(
            `Missing one of required metric property: ${
                JSON.stringify(metric)
            }`
        )
    }

    return [
        `# TYPE ${metricName} ${metricType}`,
        `# HELP ${metricName} ${metricHelp}`,
        `${metricName} ${metricValue}`,
        "\n",
    ].join("\n")
}

module.exports = {
    formatMetricPayload,
}
