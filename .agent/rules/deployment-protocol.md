# Deployment Protocol

## 🚨 CRITICAL RULE: Deployment Authorization Required

**NEVER deploy to production without explicit user authorization.**

### What Counts as Production Deploy?
- `git push origin main`
- `git push` (when on main branch)
- Any command that pushes code to remote main

### Required Protocol
1. **ALWAYS** propose the command with `SafeToAutoRun: false`
2. **WAIT** for explicit user approval
3. **NEVER** assume implicit permission
4. **NEVER** auto-push, even if user says "continue", "do it", "ok"

### Zero Tolerance
Breaking this rule = Critical failure. No exceptions.

---

## Implementation Plan Structure

Every `implementation_plan.md` **MUST** include these phases:

### 1. Proposed Changes
What will be modified

### 2. Verification Plan
How changes will be verified

**MANDATORY: Local Testing Section**
- Specify which functionalities will be tested locally
- Detail manual or automated verification steps
- Example:
  ```markdown
  ### Local Testing
  - [ ] Test feature X on localhost:5173
  - [ ] Verify feature Y works correctly
  - [ ] Check console for errors
  ```

### 3. Deployment Authorization Request
**MANDATORY: Explicitly ask if ready to deploy**
- Example: "Once verified locally, are we ready to deploy to production?"
- **DO NOT** proceed until receiving confirmation

---

## Pre-Deploy Checklist

Before proposing any `git push`:
- [ ] Do I have explicit authorization for this deploy?
- [ ] Have I clearly explained what changes will be deployed?
- [ ] Did user respond affirmatively to authorization request?
- [ ] Were functionalities tested locally?

If ANY answer is "NO", **DO NOT PUSH**.
