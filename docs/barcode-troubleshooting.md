# Barcode Scanner - Troubleshooting Guide

## ✅ Backend Status
- Server running on: `http://localhost:8000`
- Endpoint: `GET /foods/barcode/{barcode}`
- OpenFoodFacts API integrated
- Detailed logging enabled

## ✅ Frontend Status
- Scanner component created
- Error handling added
- Loading states implemented
- Console logging enabled

## 🔍 How to Debug Issues

### 1. Open Browser Console
Press `F12` or `Right-click > Inspect > Console`

### 2. Watch for These Logs When Scanning:

**Frontend logs**:
- `🔍 Scanning barcode: [number]` - Barcode detected
- `📡 Fetching from: http://localhost:8000/foods/barcode/[number]` - API call started
- `📥 Response status: [code]` - Server response (200 = success, 404 = not found)
- `✅ Food data received: [object]` - Success! Food data loaded
- `❌ Barcode scan error: [error]` - Something went wrong

**Backend logs** (in terminal):
- `🔍 Looking up barcode: [number]`
- `📡 Fetching from OpenFoodFacts: [url]`
- `📥 OpenFoodFacts response status: [code]`
- `✅ Successfully fetched food data: [name]`

### 3. Common Issues & Fixes

#### Issue: "Product not found"
**Cause**: Barcode doesn't exist in OpenFoodFacts database
**Fix**: Try these known working barcodes:
- Coca-Cola: `5449000000996`
- Nutella: `3017620422003`
- Oreo: `044000032104`
- Pringles: `5053990155668`

#### Issue: "Request timeout"
**Cause**: Slow internet or OpenFoodFacts API is down
**Fix**: 
- Check internet connection
- Try again after a few seconds
- Use manual barcode entry as fallback

#### Issue: Camera not working
**Cause**: No camera permission or camera in use
**Fix**:
- Click browser's camera permission prompt (allow)
- Close other apps using camera (Zoom, Teams, etc.)
- Try manual entry instead

#### Issue: Nothing happens when scanning
**Cause**: Barcode not detected or wrong format
**Fix**:
- Hold camera steady
- Ensure good lighting
- Try different distance from barcode
- Make sure barcode is clear and in focus
- Use manual entry with barcode number

#### Issue: CORS error
**Cause**: Frontend and backend on different domains
**Check**: 
- Backend should have CORS enabled for `*`
- Frontend should use `http://localhost:8000` or correct API_BASE

### 4. Test the Backend Directly

Open a new PowerShell terminal and run:
```powershell
# Test with Coca-Cola barcode
Invoke-WebRequest -Uri "http://localhost:8000/foods/barcode/5449000000996" | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "name": "Coca-Cola",
  "brand": "Coca-Cola",
  "serving_size": "100ml",
  "calories": 42,
  "protein": 0,
  "carbs": 10.6,
  "fat": 0,
  "barcode": "5449000000996"
}
```

### 5. Network Tab Inspection

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "Scan Barcode" and scan
4. Look for request to `/foods/barcode/...`
5. Check:
   - **Status**: Should be 200 (success) or 404 (not found)
   - **Response**: Should have food data JSON
   - **Time**: Should complete in < 5 seconds

### 6. Clear Steps to Test

1. **Start backend** (if not running):
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test in browser**:
   - Open http://localhost:5173 (or 5174)
   - Login to your account
   - Click green "Scan Barcode" button
   - Grant camera permission
   - **OR** use manual entry and type: `5449000000996`
   - Click "Search"

4. **Watch console** for logs
5. Food data should appear within 2-5 seconds

## 🆘 Still Having Issues?

Share the exact error from:
1. **Browser console** (F12 > Console tab)
2. **Backend terminal** (where uvicorn is running)
3. **Network tab** (F12 > Network > failed request)

Include:
- What barcode you're trying
- Manual entry or camera scan?
- Full error message
