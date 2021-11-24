#!/usr/bin/env node

/**
 * This script send an HTTP request to prometheus PushGateway using the text
 * payload provided as argument.
 */

const url = require('url')
const http = require('http')
const https = require('https')


const pushToGateway = (pushGatewayUri, metricsPayload, callback) => {

    console.log(`Push metrics to ${pushGatewayUri} ...`)

    const requestParams = url.parse(pushGatewayUri)
    const httpModule = /^https/.test(requestParams.href) ? https : http
    const method = "POST"
    const options = {...requestParams, method }

    // Create request instance
    const req = httpModule.request(options, res => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
            if (res.statusCode > 204) {
                callback(new Error(`Invalid response status code '${res.statusCode}' - response: ${body}`))
                return
            }

            callback(null, {
                res,
                body,
            })
        })
    })

    // Send request
    req.on('error', callback)
    req.write(metricsPayload)
    req.end()
}

module.exports = {
    pushToGateway,
}
