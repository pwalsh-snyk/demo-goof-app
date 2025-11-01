# Snyk Webhook Integration Workflow

## Overview

This workflow (`snyk-webhook-integration.yml`) automatically:
1. Scans your code for vulnerabilities using Snyk
2. Triggers webhooks when **NEW** issues are detected
3. Creates work items in Azure DevOps Boards via Azure Function

## Setup Required

### 1. GitHub Secrets

Add these secrets to your GitHub repository:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SNYK_TOKEN` | Your Snyk API token | Get from https://app.snyk.io/account |
| `SNYK_ORG_ID` | `2ff9dd2c-edc3-4aed-9261-5035fd112e8a` | Integration_Testing org ID |

### 2. Verify Azure Function

The webhook endpoint should already be configured:
- **Function**: `snyk-webhook-68258`
- **Org**: Integration_Testing
- **Webhook ID**: `efe1f6a6-1aac-450b-b1fc-4549cabffb1d`

If webhook doesn't exist, create it via Snyk API.

### 3. That's It!

Once secrets are configured, the workflow will run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger (workflow_dispatch)

## How It Works

```
Developer pushes code / Creates PR
    ↓
GitHub Actions workflow triggers
    ↓
snyk monitor runs (with --org flag)
    ↓
Snyk detects NEW vulnerabilities
    ↓
Snyk automatically sends webhook
    POST → https://snyk-webhook-68258.azurewebsites.net/api/snykwebhookfunction
    ↓
Azure Function receives webhook
    Parses newIssues array
    ↓
For each new issue:
    POST → Azure DevOps REST API
    Creates work item (type: "Issue")
    ↓
Work items appear in Azure DevOps Boards
    https://dev.azure.com/pr352312/Snyk_Boards_Testing
    ↓
Team gets notified! 🎉
```

## When Webhooks Fire

### ✅ Webhooks ARE Sent When:
- **First scan** of a project (all issues are new)
- **New dependency added** with vulnerabilities
- **Dependency updated** introducing new vulnerabilities
- **Code changes** that introduce new SAST issues

### ❌ Webhooks ARE NOT Sent When:
- Existing vulnerabilities (already known to Snyk)
- Scan finds 0 new issues
- Same vulnerabilities from previous scan

## Monitoring

### Check Workflow Runs
- Go to **Actions** tab in GitHub
- View `Snyk Webhook Integration` workflow runs
- Check if `snyk monitor` step completed

### Check Azure Function Logs
```bash
az functionapp log tail \
  --name snyk-webhook-68258 \
  --resource-group snyk-webhook-rg
```

Look for:
- `=== WEBHOOK RECEIVED ===`
- `New issues found!`
- `Successfully processed X issues.`

### Check Azure DevOps Boards
Direct URL:
```
https://dev.azure.com/pr352312/Snyk_Boards_Testing/_boards/board/t/Snyk%20Boards%20Testing/Issues
```

Look for new work items:
- Type: "Issue"
- Title: Snyk issue ID (e.g., `SNYK-JS-EXPRESS-1066947`)
- Created after workflow run

## Testing

### Test 1: Introduce New Vulnerability

1. Add a known vulnerable package:
   ```bash
   npm install debug@2.6.9 --save
   ```

2. Commit and push:
   ```bash
   git add package.json package-lock.json
   git commit -m "Test: Add vulnerable dependency"
   git push origin main
   ```

3. Watch workflow run in GitHub Actions

4. Wait 1-2 minutes for Snyk to process

5. Check:
   - Azure Function logs (should see webhook received)
   - Azure DevOps Boards (should see new work items)

### Test 2: Manual Trigger

1. Go to **Actions** → **Snyk Webhook Integration**
2. Click **Run workflow**
3. Select branch and click **Run workflow**
4. Monitor the run and check results

## Troubleshooting

### Workflow Fails at Authentication

**Error**: `Authentication failed. Please check the API token`

**Fix**:
- Verify `SNYK_TOKEN` secret is set correctly
- Token should be from https://app.snyk.io/account
- Token should have access to org `2ff9dd2c-edc3-4aed-9261-5035fd112e8a`

### No Webhooks Received

**Possible causes**:
1. **No new issues**: Check if vulnerabilities are actually NEW
   - First scan → all issues are new ✅
   - Subsequent scans → only truly new issues trigger webhooks ✅
   - Existing issues → don't trigger webhooks ❌

2. **Wrong org**: Verify `SNYK_ORG_ID` matches webhook org
   - Should be: `2ff9dd2c-edc3-4aed-9261-5035fd112e8a`
   - Webhook is configured in Integration_Testing org

3. **Webhook not configured**: Check if webhook exists
   ```bash
   curl -H "Authorization: token $SNYK_TOKEN" \
        https://api.snyk.io/v1/org/2ff9dd2c-edc3-4aed-9261-5035fd112e8a/webhooks
   ```

### Work Items Not Created

**Check**:
1. Azure Function logs for errors
2. Azure DevOps PAT permissions (Work Items Read & Write)
3. Function environment variables are set correctly
4. "Issue" work item type exists in Azure DevOps project

## Differences from Existing Workflow

This workflow (`snyk-webhook-integration.yml`) is specifically designed for webhook integration:

| Feature | This Workflow | Existing Workflow |
|---------|---------------|-------------------|
| **Purpose** | Webhook integration | General security scanning |
| **Org Flag** | ✅ Includes `--org` | ❌ Missing |
| **Webhook Trigger** | ✅ Designed to trigger webhooks | ⚠️ May not trigger reliably |
| **Azure DevOps** | ✅ Creates work items | ❌ No integration |
| **Severity Filter** | ✅ Medium+ only | ⚠️ All severities |

## Next Steps

1. ✅ Add `SNYK_ORG_ID` secret to GitHub
2. ✅ Verify `SNYK_TOKEN` secret exists
3. ✅ Push code to trigger workflow
4. ✅ Monitor Azure Function logs
5. ✅ Check Azure DevOps Boards for work items

## Related Files

- `SNYK_WEBHOOK_WORKFLOW_GUIDE.md` - Detailed integration guide
- `WORKFLOW_SETUP.md` - Quick setup instructions
- `WEBHOOK_TEST_GUIDE.md` - Testing guide
- `test-webhook.js` - Manual webhook test script

