# Snyk Security Scan Workflow

This GitHub Actions workflow provides comprehensive security scanning for your project using Snyk CLI, including:

- **SCA (Software Composition Analysis)**: Scans dependencies for known vulnerabilities
- **SAST (Static Application Security Testing)**: Scans source code for security issues
- **Container Scanning**: Scans Docker images for vulnerabilities

## Setup Instructions

### 1. Get your Snyk Token

1. Sign up for a free Snyk account at [snyk.io](https://snyk.io)
2. Go to your [Account Settings](https://app.snyk.io/account)
3. Navigate to the "API Token" section
4. Copy your API token

### 2. Add Snyk Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SNYK_TOKEN`
5. Value: Your Snyk API token from step 1
6. Click **Add secret**

### 3. Workflow Triggers

The workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull requests** to `main` branch
- **Daily schedule** at 2 AM UTC

## Workflow Features

### Security Scans

1. **SCA Scan**: Analyzes `package.json` and `package-lock.json` for vulnerable dependencies
2. **Code Scan**: Analyzes source code for security vulnerabilities and code quality issues
3. **Container Scan**: Scans Docker images for OS and application vulnerabilities (main branch only)

### Results Publishing

- Results are automatically published to your Snyk Web UI dashboard
- Projects are organized by:
  - **Project Name**: `goof-app-sca`, `goof-app-code`, `goof-app-container`
  - **Target Name**: `github-actions`
  - **Target Reference**: Git branch name

### Pull Request Integration

- Security scan results are automatically commented on pull requests
- Shows summary of vulnerabilities found
- Links to detailed results in Snyk Web UI

### Artifacts

- JSON results files are uploaded as GitHub Actions artifacts
- Available for download and further analysis

## Customization

### Severity Threshold

The workflow is configured to report vulnerabilities with `medium` severity or higher. To change this:

```yaml
--severity-threshold=high  # Only high and critical
--severity-threshold=low   # All severities
```

### Project Names

Customize project names in the Snyk Web UI by modifying:

```yaml
--project-name="your-custom-name"
```

### Branch Filtering

To run on different branches, modify the trigger:

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
```

## Monitoring Results

1. **Snyk Web UI**: Visit [app.snyk.io](https://app.snyk.io) to view detailed results
2. **GitHub Actions**: Check the Actions tab for workflow execution logs
3. **Pull Request Comments**: Review security summaries in PR discussions

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Verify your `SNYK_TOKEN` secret is correctly set
2. **No Results**: Check if your project has dependencies or if the scan completed successfully
3. **High Vulnerability Count**: This is expected for the demo app - it's intentionally vulnerable for testing

### Debug Mode

To enable debug logging, add `--debug` flag to Snyk commands:

```yaml
snyk test --debug --severity-threshold=medium
```

## Security Best Practices

- Review and fix high/critical severity issues promptly
- Use Snyk's fix suggestions and upgrade paths
- Set up Snyk notifications for new vulnerabilities
- Consider adding security gates to prevent merging vulnerable code

## Additional Resources

- [Snyk CLI Documentation](https://docs.snyk.io/developer-tools/snyk-cli)
- [Snyk Code CLI Guide](https://docs.snyk.io/developer-tools/snyk-cli/scan-and-maintain-projects-using-the-cli/snyk-cli-for-snyk-code)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
