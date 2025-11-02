# Quick Build Check Commands

## ⚠️ IMPORTANT: Check Build Before Push!

**Never push if build fails!**

---

## Commands to Run Before Pushing:

### Step 1: Build Frontend
```powershell
cd frontend
npm run build
```
**Check result:**
- ✅ Success → Continue to Step 2
- ❌ Failed → Fix errors, rebuild, DO NOT PUSH

```powershell
cd ..
```

---

### Step 2: Build Backend
```powershell
cd backend
npm run build
```
**Check result:**
- ✅ Success → Continue to Step 3
- ❌ Failed → Fix errors, rebuild, DO NOT PUSH

```powershell
cd ..
```

---

### Step 3: Push (Only if Both Builds Succeeded!)
```powershell
git push
```

---

## Quick All-in-One Commands:

### PowerShell:
```powershell
cd frontend; npm run build; cd ..; if ($LASTEXITCODE -eq 0) { cd backend; npm run build; cd ..; if ($LASTEXITCODE -eq 0) { Write-Host "✅ Safe to push!" } else { Write-Host "❌ Backend failed! DO NOT PUSH." } } else { Write-Host "❌ Frontend failed! DO NOT PUSH." }
```

### Bash:
```bash
cd frontend && npm run build && cd .. && cd backend && npm run build && cd .. && echo "✅ Safe to push!" || echo "❌ Build failed! DO NOT PUSH."
```

### Or use the script:
```powershell
.\scripts\check-build.ps1
```

---

## Rules:
1. ✅ Build frontend → Check success
2. ✅ Build backend → Check success  
3. ✅ Only push if both succeed
4. ❌ Never push if any build fails


