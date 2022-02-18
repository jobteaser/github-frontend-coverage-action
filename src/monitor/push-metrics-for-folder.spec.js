const path = require("path")
const fs = require("fs")
const { pushToGateway } = require('./push-to-pushgateway.js')
const { pushMetricsForFolder } = require("./push-metrics-for-folder")

jest.mock('./metrics-list.js', () => ({
    getMetricsList: () => [{foo: "bar"}],
}))
jest.mock('./format-metric-payload.js', () => ({
    formatMetricPayload: (metric) => JSON.stringify(metric),
}))
jest.mock('./push-to-pushgateway.js')

const FOLDERNAME = "test-folder"

describe("pushMetricsForFolder", () => {
    beforeAll(() => {
        fs.writeFileSync(
            path.resolve(__dirname, `./coverageStats_${FOLDERNAME}.json`),
            `{"total": {}}`, // only used to test parsing
            {encoding: "utf8"}
        )
        fs.writeFileSync(
            path.resolve(__dirname, `./testStats_${FOLDERNAME}.json`),
            "{}", // only used to test parsing
            {encoding: "utf8"}
        )
    })

    afterAll(() => {
        fs.unlinkSync(path.resolve(__dirname, `./coverageStats_${FOLDERNAME}.json`))
        fs.unlinkSync(path.resolve(__dirname, `./testStats_${FOLDERNAME}.json`))
    })

    it("should be a function", () => {
        expect(typeof pushMetricsForFolder).toBe("function")
    })

    it("should call pushToGateway", () => {
        const pushToGatewayMock = jest.fn()
        pushToGateway.mockImplementation(pushToGatewayMock)

        pushMetricsForFolder({
            coverageArtifactsPath: ".",
            folderName: FOLDERNAME,
            jobName: "test-jobname",
            pushGatewayUri: "http://pushgateway",
        })

        const lastMockCallArgs = pushToGatewayMock.mock.calls[pushToGatewayMock.mock.calls.length - 1]
        expect(pushToGatewayMock).toHaveBeenCalled()
        expect(lastMockCallArgs[0]).toEqual(`http://pushgateway/metrics/job/test-jobname/folder_name/${FOLDERNAME}`)
        expect(lastMockCallArgs[1]).toEqual("{\"foo\":\"bar\"}")
    })

    it("should attempt 5 times to push metrics before failing", () => {
        jest.useFakeTimers()

        let attemptsCount = 0
        const pushToGatewayMock = jest.fn((url, payload, callback) => {
            callback(new Error("Test error."))
            attemptsCount++
            jest.runAllTimers()
        })
        pushToGateway.mockImplementation(pushToGatewayMock)

        expect(() => {
            pushMetricsForFolder({
                coverageArtifactsPath: ".",
                folderName: FOLDERNAME,
                jobName: "test-jobname",
                pushGatewayUri: "http://pushgateway",
            })
        }).toThrow(/Test error/)
        expect(attemptsCount).toEqual(5)
    })
})
