---
applyTo: "**"
---

# Project security best practices

- Always run Snyk Code scanning tool for new first party code generated.
- Always run Snyk SCA scanning tool for new dependencies or dependency updates.
- If ANY security issues are found based on newly introduced or modified code or dependencies, attempt to fix the issues using the results context from Snyk. Do this regardless of the severity of the issues.
- Rescan the code after fixing the issues to ensure that the issues were fixed and that there are no newly introduced issues.
- Repeat this process until no issues are found.
