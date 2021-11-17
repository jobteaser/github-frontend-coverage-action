#!/usr/bin/env bash

set -e

# This script push computed metrics to Prometheus.

# It expects coverage metrics to be exposed in a tar.gz file called
# `coverage-artifacts.tar.gz` and present at root of project.

echo

coverageArtifactFile="coverage-artifacts.tar.gz"
metricsJobName=$1
pushGatewayUri=$2

cat <<EOF
Provided parameters:
- metricsJobName: $metricsJobName
- pushGatewayUri: $pushGatewayUri

EOF

if [ "$metricsJobName" = "" ] || [ "$pushGatewayUri" = "" ]; then
    echo "ERROR: Missing one of required parameters: metricsJobName, pushGatewayUri."
    echo "Usage: $0 <metricsJobName> <pushGatewayUri>"
    echo "Ex: $0 myapp_coverage http://localhost:9091"
    exit 1
fi

# Extract coverage stats from tar file
tar xvzf $coverageArtifactFile
coverageArtifactsPath=$(pwd)/coverage-artifacts

function pushMetrics() {
    coverageFile=$1
    fileWithExtension="${coverageFile##*/coverageStats_}"
    srcFolderName="${fileWithExtension%%.*}"
    echo "Push metrics for folder: ${srcFolderName}"
    $(dirname $0)/push-metrics-for-folder.js "$coverageArtifactsPath" "$srcFolderName" "$metricsJobName" "$pushGatewayUri"
    echo
}

# Push all collected metrics
coverageFiles="./coverage-artifacts/coverageStats_*"
echo "Coverage files:" $coverageFiles
for coverageFile in $coverageFiles; do
    pushMetrics $coverageFile
done