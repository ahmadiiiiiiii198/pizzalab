# 🎉 RURÀL PIZZA - AUTOMATIC PRINTING SYSTEM

## ✅ **SYSTEM IS READY AND RUNNING!**

Your complete automatic order printing system is now **100% operational**!

---

## 🚀 **QUICK START - ONE CLICK!**

### **Option 1: Start Everything (RECOMMENDED)**

Double-click:
```
start-all.bat
```

This starts:
- ✅ Print Server (port 3001)
- ✅ Web Application (port 5173)
- ✅ Auto-print ENABLED by default

### **Option 2: Start Manually**

**Terminal 1 - Print Server:**
```bash
node print-server.cjs
```

**Terminal 2 - Web App:**
```bash
npm run dev
```

---

## 🖨️ **HOW IT WORKS**

### **Automatic Flow:**

```
1. Customer places order on website
   ↓
2. Order saved to Supabase database
   ↓
3. Real-time subscription detects new order
   ↓
4. Auto-print hook triggered (useAutoPrint)
   ↓
5. HTTP POST → localhost:3001/print
   ↓
6. Print server receives order data
   ↓
7. Generates ESC/POS commands
   ↓
8. Sends to COM32 port
   ↓
9. Epson TM-T70II prints receipt
   ↓
10. ✅ DONE! (No manual intervention!)
```

---

## ⚙️ **CONFIGURATION**

### **Auto-Print Settings:**
- **Status:** ✅ ENABLED by default
- **Printer:** POS-80(copy of 2)
- **Port:** COM32 (192.168.1.32)
- **Server:** localhost:3001

### **To Change Settings:**
1. Open admin panel
2. Go to "Impostazioni Stampante"
3. Modify printer name or toggle auto-print
4. Click "Salva Impostazioni"

---

## 📋 **SYSTEM COMPONENTS**

### **1. Print Server (`print-server.cjs`)**
- Runs on port 3001
- Communicates with COM32
- Sends ESC/POS commands
- Handles all print jobs

### **2. Auto-Print Hook (`use-auto-print.tsx`)**
- Listens for new orders via Supabase real-time
- Automatically triggers printing
- Prevents duplicate prints
- Shows notifications

### **3. Printer Service (`printerService.ts`)**
- Formats order data
- Sends HTTP requests to print server
- Handles test prints
- Manages settings

### **4. Admin Panel Integration**
- Settings UI in admin panel
- Test print functionality
- Enable/disable auto-print
- Configure printer name

---

## 🧪 **TESTING**

### **Test 1: Print Server Health**
Open browser: http://localhost:3001/health

Expected response:
```json
{"status":"ok","printer":"COM32","ip":"192.168.1.32"}
```

### **Test 2: Direct Test Print**
Open browser: http://localhost:3001/test

Or use PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:3001/test -Method POST
```

Expected: Receipt prints on Epson TM-T70II

### **Test 3: From Admin Panel**
1. Go to admin panel
2. Navigate to "Impostazioni Stampante"
3. Click "Test Stampante"
4. Receipt should print immediately!

### **Test 4: Real Order**
1. Place a test order from your website
2. Wait 2-3 seconds
3. Receipt should print automatically!
4. Check console for: "🖨️ Printing order: ORD-XXX"

---

## 📄 **RECEIPT FORMAT**

Your receipts include:
- ✅ RURÀL PIZZA branding
- ✅ Order number and timestamp
- ✅ Customer name, phone, address
- ✅ All order items with quantities
- ✅ Prices and totals
- ✅ Delivery fee (if applicable)
- ✅ Special notes
- ✅ Payment method
- ✅ Footer with website

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Print server not starting**

**Check:**
```bash
# Verify dependencies
npm list express cors serialport

# Reinstall if needed
npm install express cors serialport
```

### **Problem: Prints not working**

**Checklist:**
1. ✅ Print server running? Check http://localhost:3001/health
2. ✅ Printer powered on?
3. ✅ COM32 port available? Check Device Manager
4. ✅ Auto-print enabled? Check admin panel settings
5. ✅ Web app running? Check http://localhost:5173

### **Problem: "Connection refused"**

**Solution:**
- Print server not running
- Start it: `node print-server.cjs`
- Or use: `start-all.bat`

### **Problem: Duplicate prints**

**Solution:**
- Auto-print hook has duplicate prevention
- If issue persists, check browser console for errors
- Restart both servers

---

## 🎯 **AUTOMATIC STARTUP (Optional)**

### **Option A: Windows Startup Folder**

1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start-all.bat`
4. System starts automatically on boot!

### **Option B: Windows Service (Advanced)**

Run as Administrator:
```powershell
.\install-print-service.ps1
```

This installs print server as a Windows service that:
- Starts automatically on boot
- Runs in background
- Restarts if it crashes
- Managed via services.msc

---

## 📊 **MONITORING**

### **Print Server Logs:**
Watch the print server terminal for:
```
📥 Received print request
✅ COM32 port opened
✅ Data sent to printer
✅ Print successful
```

### **Web App Console:**
Watch browser console for:
```
🖨️ Printing order: ORD-XXX
✅ Print job sent successfully
```

### **Admin Panel:**
- Shows print success/failure notifications
- Displays printer status
- Test functionality available

---

## ✅ **FINAL CHECKLIST**

- ✅ Print server installed and running
- ✅ Dependencies installed (express, cors, serialport)
- ✅ COM32 port configured and working
- ✅ Epson TM-T70II connected (192.168.1.32)
- ✅ Auto-print enabled by default
- ✅ Test print successful
- ✅ Web app integrated
- ✅ Admin panel configured
- ✅ Real-time subscriptions active
- ✅ Startup scripts created

---

## 🎉 **YOU'RE ALL SET!**

Your RURÀL PIZZA automatic printing system is:

✅ **FULLY AUTOMATIC** - No manual intervention needed  
✅ **PRODUCTION READY** - Tested and working  
✅ **REAL-TIME** - Prints within seconds of order  
✅ **RELIABLE** - COM32 direct connection  
✅ **EASY TO USE** - One-click startup  

**Just run `start-all.bat` and you're ready to receive orders with automatic printing!** 🚀🖨️✨

---

## 📞 **SUPPORT**

If you need help:
1. Check print server logs
2. Check browser console
3. Verify COM32 in Device Manager
4. Test with http://localhost:3001/test
5. Check printer is powered on and has paper

---

**Last Updated:** 2025-01-09 22:53  
**Status:** ✅ FULLY OPERATIONAL  
**Version:** 1.0 PRODUCTION
