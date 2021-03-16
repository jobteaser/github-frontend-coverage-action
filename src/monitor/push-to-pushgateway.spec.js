const nock = require('nock')

const { pushToGateway } = require("./push-to-pushgateway")

describe("pushToGateway", () => {
    const PAYLOAD = "foobar payload"

    it("should be a function", () => {
        expect(typeof pushToGateway).toBe("function")
    })

    it("should send a request to pushgateway endpoint", (done) => {
        // Define request interceptor
        nock('http://pushgateway')
            .post('/metrics/job/foojob/folder_name/foofolder', PAYLOAD)
            .reply(200)

        pushToGateway(
            `http://pushgateway/metrics/job/foojob/folder_name/foofolder`,
            PAYLOAD,
            jest.fn((err, resp) => {
                expect(err).toBe(null)
                expect(resp).not.toBe(undefined)
                done()
            })
        )
    })

    it("should trigger callback with error if pushgateway in unreachable", (done) => {
        pushToGateway(
            `http://pushgateway/metrics/job/foojob/folder_name/foofolder`,
            PAYLOAD,
            jest.fn((err, resp) => {
                expect(err).not.toBe(null)
                expect(resp).toBe(undefined)
                done()
            })
        )
    })
})
