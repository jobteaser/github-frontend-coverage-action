const { formatMetricPayload } = require("./format-metric-payload")

const metric = {
    metricName: "foo",
    metricType: "foo_type",
    metricHelp: "foo desc",
    metricValue: 23,
}

describe("formatMetricPayload", () => {
    it("should be a function", () => {
        expect(typeof formatMetricPayload).toBe("function")
    })

    it("should throw if a metric is missing", () => {
        const incompleteMetric = { ...metric }
        delete(incompleteMetric.metricType)
        expect(() => formatMetricPayload(incompleteMetric)).toThrow()
    })

    it("should return a formatted payload for Prometheus", () => {
        expect(formatMetricPayload(metric)).toEqual(
            `# TYPE foo foo_type\n# HELP foo foo desc\nfoo 23\n\n`
        )
    })
})
