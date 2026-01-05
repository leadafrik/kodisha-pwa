# GIT HISTORY VERIFICATION & SANITIZATION

## 🚨 CRITICAL: Check if .env was Ever Committed

Run these commands **immediately** to check git history:

### Step 1: Check for .env Files in History

```bash
# Check if .env file was ever committed
git log --all --full-history -- ".env"

# Check for deleted .env files
git log --all --full-history --diff-filter=D -- ".env"

# Check if any .env.* files were committed
git log --all --full-history -- ".env.*"
```

**Expected Output:**
- **If nothing:** ✅ Good! .env was never committed
- **If commits show:** ⚠️ .env is in history - proceed to Step 2

### Step 2: Search for Exposed Credentials in History

```bash
# Search for MongoDB connection strings
git log -p --all -S "mongodb+srv" | head -50

# Search for JWT secrets
git log -p --all -S "JWT_SECRET" | head -50

# Search for API keys
git log -p --all -S "CLOUDINARY_API" | head -50

# Search for Auth tokens
git log -p --all -S "AUTH_TOKEN" | head -50
```

**Expected Output:**
- **If nothing:** ✅ Good! Credentials not in history
- **If code/configs show:** ⚠️ Credentials are in history - proceed to Step 3

### Step 3: Identify Commits Containing Secrets

If credentials found, identify the commits:

```bash
# Find exact commits with exposed credentials
git log --all --oneline -S "mongodb+srv"

# Output will look like:
# 3a1b2c3 [Commit message with .env change]
# 4d5e6f7 [Another commit]

# Note these commit hashes - you'll need them for removal
```

---

## ⚠️ IF .env WAS FOUND IN HISTORY

### Option A: Git Filter-Branch (Simple, Recommended for Small Repos)

**⚠️ WARNING: This rewrites all git history. All developers need fresh clones.**

```bash
# 1. Backup current repo
cp -r . ../kodisha-backup-$(date +%Y%m%d_%H%M%S)

# 2. Remove .env from all history
git filter-branch --tree-filter 'rm -f .env .env.local .env.*.local' HEAD --all

# 3. Force push to remote (ONLY IF YOU'RE SURE)
git push origin --force --all
git push origin --force --tags

# 4. Tell all developers to re-clone
# Send message: "Please delete your local repo and re-clone from main"
```

### Option B: BFG Repo-Cleaner (Faster for Large Repos)

```bash
# 1. Install BFG (if not already installed)
brew install bfg  # macOS
choco install bfg # Windows
apt-get install bfg # Linux

# 2. Remove .env files from history
bfg --delete-files .env

# 3. Clean up
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 4. Force push
git push origin --force --all
git push origin --force --tags

# 5. Notify team to re-clone
```

### Option C: Manual Removal (For Specific Commits)

```bash
# If only a few commits contain secrets:

# 1. Find the commit before the first exposure
# Example: commit 1a2b3c4 introduced the .env

# 2. Rebase and remove the file
git rebase -i 1a2b3c4~1

# 3. In the editor that opens:
# - Find commits where .env was added
# - Change 'pick' to 'edit'
# - Save and close

# 4. For each commit:
git rm .env
git commit --amend --no-edit
git rebase --continue

# 5. Force push
git push origin --force --all
```

---

## ✅ After Sanitization

### Verify Removal

```bash
# Confirm .env is removed from all history
git log --all --full-history -- ".env"
# Should return: nothing

# Confirm no credentials in history
git log -p --all | grep -i "mongodb\|jwt_secret\|api_key" | wc -l
# Should return: 0
```

### Notify Team

```markdown
**SECURITY UPDATE: Git History Sanitized**

Credentials were found in git history. We've removed them.

**REQUIRED ACTION:**
1. Stop working immediately
2. Delete your local repository copy
3. Clone fresh from main:
   git clone https://github.com/your-org/kodisha.git
4. Resume work

**Why:**
- Your current clone contains exposed credentials
- Only a fresh clone will have the sanitized history

**Questions?**
- Contact: [DevOps Lead]
- Reference: Security incident #2024-01-15
```

---

## 🔍 Verify .gitignore Is Working

After fixing .gitignore, verify it works:

```bash
# 1. Add a test .env file
echo "TEST_SECRET=should_not_be_committed" > .env

# 2. Try to add it to git
git add .env
# Should output: "The following paths are ignored by one of your .gitignore files"

# 3. Verify it's not in staging
git status
# Should NOT show .env in "Changes to be committed"

# 4. Clean up
rm .env
```

---

## 📋 Post-Sanitization Checklist

- [ ] Ran git history verification commands
- [ ] Confirmed .env is not in history
- [ ] Confirmed credentials not in history
- [ ] Updated .gitignore with .env patterns
- [ ] Installed pre-commit hook
- [ ] Tested .gitignore (test .env file ignored)
- [ ] If sanitization needed: Completed git filter-branch
- [ ] If sanitization needed: Notified team to re-clone
- [ ] Updated credentials (rotated all exposed secrets)
- [ ] Verified application works with new credentials
- [ ] Documented incident and remediation steps

---

## 🚨 If Repo Was Public

If your GitHub/GitLab repository was public before sanitization:

**Assume all credentials in history are COMPROMISED**

1. ✅ Rotate ALL credentials (already in progress)
2. ✅ Sanitize git history (above steps)
3. ⚠️ Monitor for abuse:
   - Check MongoDB access logs for suspicious connections
   - Check API usage spikes in Cloudinary, Twilio, etc.
   - Monitor costs for unexpected usage
4. ✅ Set repository to PRIVATE
5. ✅ Enable branch protection
6. ✅ Consider incident disclosure/notification

---

## 🔗 Resources

- [GitHub: Removing sensitive data from history](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Branch](https://git-scm.com/docs/git-filter-branch)

---

## Need Help?

**If git history removal fails:**
1. Stop and don't force push
2. Restore from backup: `cp -r ../kodisha-backup-* .`
3. Consult git documentation
4. Contact security team

**Safety First:** It's better to ask for help than to accidentally corrupt the repository.
