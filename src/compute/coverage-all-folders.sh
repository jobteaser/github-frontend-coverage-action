#!/usr/bin/env bash

# This script computes the test coverage for all folders

echo

folderList=$1
echo "Folders list:" $folderList
if [ "$folderList" = "" ]; then
    echo "ERROR: Please provide the list of folders against which to run the coverage computation."
    echo "Ex: $0 ./folder1 ./folder2/subfolder ./src"
    exit 1
fi

allowList=".*" # Debug for a sub-list of folders with: "folder1|folder2"
# allowList="folder1|folder2"

function computeCoverage {
    folderPath=$1

    echo "Computing coverage for folder: $folderPath"

    if [[ "$folderPath" =~ $allowList ]]; then
        npm run test:ci:coverage -- $folderPath --json --outputFile=jest-output.json

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
        folderName="${folderPath##*/}"
        mv coverage/coverage-summary.json coverage-artifacts/coverageStats_${folderName}.json
        mv jest-output.json coverage-artifacts/testStats_${folderName}.json

        # Clear stats
        rm -rf coverage jest-output.json
    else
        echo -e "\tSKIPPED."
    fi

    echo
}

echo

mkdir coverage-artifacts/

# Compute coverage for all folders
for folderPath in $folderList; do
    computeCoverage $folderPath
done

# Tar all coverage stats
tar cvzf coverage-artifacts.tar.gz coverage-artifacts
