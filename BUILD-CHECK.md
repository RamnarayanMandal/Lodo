# Build Check Commands

Before pushing code, always check if the build is successful. Use one of the methods below:

## Method 1: Use the Build Check Script (Recommended)

### PowerShell (Windows):
```powershell
.\scripts\check-build.ps1
```

### Bash/Git Bash:
```bash
chmod +x scripts/check-build.sh
./scripts/check-build.sh
```

## Method 2: Manual Build Commands (Step by Step)

Run these commands **one by one** and check if each succeeds:

### Step 1: Build Frontend

**Command:**
```powershell
cd frontend
npm run build
```

**What to check:**
- ✅ If you see "Build completed successfully" or no errors → Frontend build passed
- ❌ If you see "Failed to compile" or TypeScript errors → Frontend build failed

**If build FAILS:**
- ❌ **DO NOT PUSH**
- Fix all TypeScript/compilation errors shown
- Run `npm run build` again
- Repeat until build succeeds

**If build SUCCEEDS:**
- Continue to Step 2

**Return to root:**
```powershell
cd ..
```

---

### Step 2: Build Backend

**Command:**
```powershell
cd backend
npm run build
```

**What to check:**
- ✅ If you see no TypeScript errors → Backend build passed
- ❌ If you see TypeScript compilation errors → Backend build failed

**If build FAILS:**
- ❌ **DO NOT PUSH**
- Fix all TypeScript errors in `backend/src`
- Run `npm run build` again
- Repeat until build succeeds

**If build SUCCEEDS:**
- Continue to Step 3

**Return to root:**
```powershell
cd ..
```

---

### Step 3: Push to Git (Only if Both Builds Succeeded)

**Only run this if:**
- ✅ Frontend build succeeded
- ✅ Backend build succeeded

**Command:**
```powershell
git push
```

**If either build failed:**
- ❌ **DO NOT RUN `git push`**
- Fix the errors first
- Rebuild and check again

## Method 3: Git Pre-Push Hook (Automatic)

The pre-push hook will automatically check builds before allowing push:

```powershell
# Make sure the hook is executable (on Linux/Mac/Git Bash)
chmod +x .git/hooks/pre-push
```

Now when you run `git push`, it will:
1. ✅ Build frontend automatically
2. ✅ Build backend automatically  
3. ✅ Only push if both builds succeed
4. ❌ Block push if any build fails

## Quick Reference

### All-in-One Commands (Run Both Builds):

**PowerShell:**
```powershell
cd frontend; npm run build; cd ..; if ($LASTEXITCODE -eq 0) { cd backend; npm run build; cd ..; if ($LASTEXITCODE -eq 0) { Write-Host "✅ All builds successful! Safe to push." } else { Write-Host "❌ Backend build failed! DO NOT PUSH." } } else { Write-Host "❌ Frontend build failed! DO NOT PUSH." }
```

**Bash/Git Bash:**
```bash
cd frontend && npm run build && cd .. && cd backend && npm run build && cd .. && echo "✅ All builds successful! Safe to push." || echo "❌ Build failed! DO NOT PUSH."
```

**After running the all-in-one command:**
- If you see "✅ All builds successful!" → You can push
- If you see "❌ Build failed!" → **DO NOT PUSH**, fix errors first

## Troubleshooting

### If frontend build fails:
1. Check for TypeScript errors: `cd frontend && npm run lint`
2. Fix all type errors
3. Rebuild: `npm run build`

### If backend build fails:
1. Check TypeScript errors in `backend/src`
2. Fix all compilation errors
3. Rebuild: `cd backend && npm run build`

### If npm install needed:
```powershell
cd frontend
npm install
cd ..
cd backend  
npm install
cd ..
```

## Remember
- ⚠️ **NEVER push if build fails**
- ✅ **Always check build before pushing**
- 🔍 **Use the script for automatic checking**

