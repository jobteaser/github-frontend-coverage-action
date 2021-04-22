#!/usr/bin/env node

// This script computes the test coverage for all folders

const path = require("path")
const { execSync } = require("child_process")

const onError = message => (console.log(message), process.exit(1))
const run = (task, errorMsg) => {
    try {
        task()
    } catch (e) {
        onError(`ERROR: ${errorMsg} \n ${e.message}`)
    }
}

const foldersConfigPath = process.argv.slice(2)[0]

if (!foldersConfigPath) {
    onError(
        `Please provide a JSON config file describing the list of folders against which to run the coverage computation.
        Ex: $0 folders-config.json`
    )
}

// Create artifacts folder
run(
    () => execSync("mkdir -p coverage-artifacts"),
    `Failed to create coverage artifacts folder`
)

// Compute coverage for all folders
require(path.resolve(foldersConfigPath))
    .forEach(({id, folders}) => {
        run(
            () => execSync(`${__dirname}/coverage-for-folder.sh -i ${id} -f "${folders.join(" ")}"`),
            `There was an error when computing coverage for "${id}"`
        )
    })

// Tar all coverage stats
run(
    () => execSync("tar cvzf coverage-artifacts.tar.gz coverage-artifacts"),
    `Failed to create coverage-artifacts archive`
)