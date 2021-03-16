# github-frontend-coverage-action ![ci workflow](https://github.com/jobteaser/github-frontend-coverage-action/actions/workflows/ci.yml/badge.svg)

This Github action allows to compute test coverage (as reported by Jest) and to monitor it by sending coverage metrics to Pushgateway of Prometheus. What you do with those metrics is up to you but you may choose to display them in a Grafana dashboard for example.

## Prerequisites

For this github action to work, **you must provide**:
- a **dedicated NPM script called `test:ci:coverage`**. This script when called (by the `compute` step - see below) must run jest with the right jest config. This script must also accept a dynamic path to restrict the run of tests and coverage to a specific folder (ex: `npm run test:ci:coverage -- ./src/feature1`). The script will also be passed other options (`--json`, `--outputFile=jest-output.json`) to retrieve jest test stats. **You are expected to transfer any options passed to `test:ci:coverage`, to Jest CLI**.
- the **coverage reporter `json-summary`** to the list of `coverageReporters` in your jest config (ex: `coverageReporters: ["text", "html", "json-summary"],`)
- a `coverageDirectory` option to jest config, with the value `<rootDir>/coverage`


## How to use this action?

This github action holds 2 steps that can be called independently, to either compute coverage or send coverage metrics to prometheus.

To choose which step to run, pass a parameter `task` with one of those values:
- `compute` to run the computing of code coverage
- `monitor` to send the metrics extracted during task `compute`, to the PushGateway of Prometheus

```yml
# Compute coverage
- uses: jobteaser/github-frontend-coverage-action
  with:
    task: "compute"
    folder-list: "./src/feature1 ./src/feature2"

# Monitor coverage
- uses: jobteaser/github-frontend-coverage-action
  with:
    task: "monitor"
    metric-job-name: "myproject_coverage"
    push-gateway-uri: "${{ secrets.PUSH_GATEWAY_URI }}"
```

This would then send metrics to Pushgateway of Prometheus to paths:
- `/metrics/job/myproject_coverage/folder_name/feature1`
- `/metrics/job/myproject_coverage/folder_name/feature2`

This means that you could then **follow coverage metrics independently** for code in feature1 and feature2 if you want to (useful for mono-repos hosting multiple applications).

### `compute` step

The `compute` step expects only one parameter:
- `folder-list`: a **string** made of **space separated list of folders** against which to run the coverage computing

This step will iterate over the provided folder list and call the coverage script once per folder. This will be done thanks to the NPM script `test:ci:coverage` that you must provide (see [prerequisites](#prerequisites)).

```shell
npm run test:ci:coverage -- ./src/feature1
```

This step produces an archive called `coverage-artifacts.tar.gz` containing all the computed metrics for all folders (in JSON files).
```text
# Content of coverage-artifacts.tar.gz
coverageStats_feature1.json
coverageStats_feature2.json
testStats_feature1.json
testStats_feature2.json
```

### `monitor` step

The `monitor` step expects 2 parameters:
- `metric-job-name`: a **string** describing the identifier used as **job name** for the Prometheus metric
- `push-gateway-uri`: a **string** describing the URI of the PushGateway of Prometheus that will receive the coverage metrics

This step expect to find an archive called `coverage-artifacts.tar.gz` at root of project. This archive and its content (a list of JSON files) is produced during the `compute` step. Using metrics contained in the archive, this step will format them for Prometheus and send them to the PushGateway.

#### Metrics sent

Here is the **list of metrics sent to Prometheus**:
- `testSuites_total`
- `testSuitesPassed_total`
- `testSuitesFailed_total`
- `testSuitesSkipped_total`
- `tests_total`
- `testsPassed_total`
- `testsSkipped_total`
- `testsFailed_total`
- `snapshots_total`
- `duration_total`
- `lines_percent`
- `statements_percent`
- `functions_percent`
- `branches_percent`

Let's take an example, assuming:
- the PushGateway URI is `http://localhost:9091`
- we computed coverage for 2 folders `./src/feature1` and `./src/feature2`

Here is an example of what would be sent to Prometheus:

**On pushGateway endpoint: `http://localhost:9091/metrics/job/myproject_coverage/folder_name/feature1`**
```
# TYPE testSuites_total gauge
# HELP testSuites_total Total of test suites for folder
testSuites_total 23

# TYPE tests_total gauge
# HELP tests_total Total of tests for folder
tests_total 100

...
```
**On pushGateway endpoint: `http://localhost:9091/metrics/job/myproject_coverage/folder_name/feature2`**
```
# TYPE testSuites_total gauge
# HELP testSuites_total Total of test suites for folder
testSuites_total 12

# TYPE tests_total gauge
# HELP tests_total Total of tests for folder
tests_total 76

...
```

## Detailed usage in a more complete workflow

Here is a more complete workflow example showing how you may use this github action to monitor coverage **once per day**.

The following example suppose few things for the sake of providing a detailed workflow:
- You have references to private github repos in your `package.json`
- You have references to private NPM packages in your `package.json`

We also added trivial steps such as:
- checkout
- ssh configuration
- npm registry configuration
- install of dependencies
- building of a list of folders against which to run coverage

Finally, to demonstrate how to separate compute of coverage and monitor of metrics, we **splitted the 2 tasks in 2 different jobs**.

```yml
name: "Coverage monitoring"
on:
  schedule:
    - cron:  "0 6 * * 1-5" # At 6AM every day, from monday to friday (UTC)
  push:
      branches:
        - master

jobs:
  compute_job:
    runs-on: ubuntu-20.04
    container: node:10.13-jessie
    steps:
      - name: "Checkout"
        uses: actions/checkout@v2
      # If using private repositories in your package.json file
      - name: "Setup SSH key for private repos"
        uses: webfactory/ssh-agent@v0.5.0
        with:
          ssh-private-key: ${{ secrets.GH_USER_PRIVATE_SSH_KEY }}
      # If using private NPM packages in your package.json file
      - name: "Authenticate with NPM registry"
        run: echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN_READONLY }}" > ~/.npmrc
      # Install dependencies
      - name: "Install NPM dependencies"
        run: npm ci
      # Compute list of folders targetted by coverage computing
      - name: "Build list of folders against which to compute coverage"
        id: step_folder_list
        run: |
          FOLDER_LIST="./src/features/* ./src/another_folder"
          echo "::set-output name=list::$FOLDER_LIST"

      # ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      # Our coverage action: step "compute"
      - uses: jobteaser/github-frontend-coverage-action
        with:
          task: "compute"
          folder-list: ${{ steps.step_folder_list.outputs.list }}
      # ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

      # This upload step allows to share coverage metrics between our 2 jobs
      - name: Upload coverage artifacts
        uses: actions/upload-artifact@v2
        with:
          name: coverage-artifacts
          path: coverage-artifacts.tar.gz

  monitor_job:
    # Or use `runs-on: self-hosted` if your pushGateway is hidden from the internet
    runs-on: ubuntu-20.04
    container: node:10.13-jessie
    needs: compute_job
    steps:
      # Download coverage metrics previously uploaded
      - name: Download coverage artifacts
        uses: actions/download-artifact@v2
        with:
          name: coverage-artifacts

      # ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      # Our coverage action: step "monitor"
      - uses: jobteaser/github-frontend-coverage-action
        with:
          task: "monitor"
          metric-job-name: "myproject_coverage"
          push-gateway-uri: "${{ secrets.PUSH_GATEWAY_URI }}"
      # ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
```
