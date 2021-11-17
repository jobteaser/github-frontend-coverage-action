#!/usr/bin/env bash

set -e

# This script computes the test coverage for a list of folders

echo

fatal() {
    printf "$*\n" >/dev/stderr
    exit 1
}

usage() {
    cat <<EOF
usage: $0 OPTIONS
OPTIONS
-h display help
-i identifier for folders list - mandatory
-f folders list (space separated string) - mandatory

Ex: $0 -i my_app -f "./folder1 ./folder2/subfolder ./src"
EOF
}

OPTIND=1
while getopts 'hi:f:' arg; do
    case "$arg" in
	h) usage; exit 0 ;;
	i) identifier="$OPTARG" ;;
	f) folders="$OPTARG" ;;
	?) fatal "option error" ;;
    esac
done
shift "$((OPTIND - 1))"

if [ -z "$identifier" ] || [ -z "$folders" ]; then
    fatal "ERROR: Missing options.\n\n$(usage)"
fi

allowList=".*" # Debug for a sub-list of folders with: "folder1|folder2"
# allowList="folder1|folder2"

function computeCoverage {

    echo "Computing coverage for folders: ${folders}"

    if [[ "$folders" =~ $allowList ]]; then
        npm run test:ci:coverage -- "${folders}" --json --outputFile=jest-output.json

        # Add endTime of tests to monitor duration
        testEndTime=$(node -e 'console.log(Date.now())')
        cat jest-output.json | sed -E "s/^\{/{\"endTime\":$testEndTime,/" > jest-output-updated.json
        mv jest-output-updated.json jest-output.json

        # Verify that coverage/coverage-summary.json exists
        if [ ! -f coverage/coverage-summary.json ]; then
            echo "ERROR - Could not find coverage/coverage-summary.json."
            echo "This may happen when the 'json-summary' coverage reporter is not used (see Readme)."
            exit 1
        fi

        # Verify that jest-output.json exists
        if [ ! -f jest-output.json ]; then
            echo "ERROR - Could not find jest-output.json"
            echo "This may happen if  NPM script 'test:ci:coverage' is not able to receive options '--json --outputFile=jest-output.json' (see README)."
            exit 1
        fi

        # Make sure that each folder coverage run are saved in unique folders/files
        mv coverage/coverage-summary.json coverage-artifacts/coverageStats_${identifier}.json
        mv jest-output.json coverage-artifacts/testStats_${identifier}.json

        # Clear stats
        rm -rf coverage jest-output.json
    else
        echo -e "\tSKIPPED."
    fi

    echo
}

computeCoverage ${folders}

echo
