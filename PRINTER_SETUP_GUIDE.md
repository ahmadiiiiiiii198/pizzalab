# 🖨️ Epson TM-T20III Automatic Printing Setup Guide

## 🎯 Complete System Overview

Your PizzaLab website now has **automatic order printing** integrated! When a new order arrives, it will automatically print to your Epson TM-T20III thermal printer.

---

## 📋 What's Been Added

### ✅ **1. Printer Service** (`src/services/printerService.ts`)
- Handles order printing with formatted receipts
- Supports Epson TM-T20III thermal printer
- Generates 80mm thermal receipt format
- Includes all order details, customer info, and totals

### ✅ **2. Printer Settings Component** (`src/components/admin/PrinterSettings.tsx`)
- Configure printer name
- Enable/disable auto-print
- Test printer connection
- Save settings to localStorage

### ✅ **3. Auto-Print Hook** (`src/hooks/use-auto-print.tsx`)
- Listens for new orders in real-time
- Automatically prints when enabled
- Prevents duplicate prints
- Shows notifications on print success/failure

### ✅ **4. Admin Panel Integration**
- New "Printer Settings" tab in admin panel
- Configure and test printer directly from web interface

### ✅ **5. Setup Script** (`setup-printer.ps1`)
- Automated Windows printer detection
- Driver verification
- Test print functionality

---

## 🚀 Setup Instructions

### **Step 1: Connect Printer**
1. Connect Epson TM-T20III to your computer via USB
2. Turn on the printer
3. Wait for Windows to detect it

### **Step 2: Install Drivers**
1. Download drivers from: https://epson.com/Support/Printers/POS-Printers/TM-T20III/s/SPT_C31CH51011
2. Run the installer
3. Follow the installation wizard
4. Restart computer if prompted

### **Step 3: Add Printer to Windows**
1. Open **Settings** → **Devices** → **Printers & scanners**
2. Click **"Add a printer or scanner"**
3. Select **"EPSON TM-T20III"**
4. Click **"Add device"**
5. Set as default printer (optional)

### **Step 4: Run Setup Script**
```powershell
# Right-click and "Run as Administrator"
.\setup-printer.ps1
```

This script will:
- ✅ Detect connected printers
- ✅ Verify Epson drivers
- ✅ Show printer name to use
- ✅ Send test print

### **Step 5: Configure in Admin Panel**
1. Open your PizzaLab admin panel
2. Go to **"Impostazioni Stampante"** (Printer Settings) tab
3. Enter the printer name (from Step 4)
4. Enable **"Stampa automatica nuovi ordini"**
5. Click **"Test Stampante"** to verify
6. Click **"Salva Impostazioni"**

---

## 🎮 How It Works

### **Automatic Printing Flow:**
```
New Order Placed
    ↓
Database Insert (orders table)
    ↓
Real-time Subscription Triggered
    ↓
Auto-Print Hook Detects New Order
    ↓
Printer Service Formats Receipt
    ↓
Print Job Sent to Epson Printer
    ↓
Receipt Printed! 🎉
```

### **Receipt Format:**
```
================================
      🍕 PIZZALAB
   Laboratorio di Pizza Italiana
   Tel: +39 XXX XXX XXXX
================================

ORDINE #ORD-20250109-001
Data: 09/01/2025 21:30:45
Tipo: 🚗 CONSEGNA
Pagamento: Contanti

┌────────────────────────────┐
│ CLIENTE:                   │
│ Nome: Mario Rossi          │
│ Tel: +39 123 456 7890      │
│ Indirizzo: Via Roma 123    │
└────────────────────────────┘

1x Pizza Margherita     €8.00
   Note: Senza origano
2x Pizza Diavola       €20.00
1x Coca Cola            €3.00
────────────────────────────
Subtotale:             €31.00
Consegna:               €3.00
────────────────────────────
TOTALE:                €34.00

Note:
Citofono al piano 2

        Grazie per il tuo ordine!
           www.pizzalab.it
      ━━━━━━━━━━━━━━━━━━━━
```

---

## ⚙️ Configuration Options

### **Printer Settings (localStorage)**
```json
{
  "printerName": "EPSON TM-T20III",
  "autoPrintEnabled": true
}
```

### **Common Printer Names:**
- `EPSON TM-T20III`
- `EPSON TM-T20III Receipt`
- `TM-T20III`

---

## 🔧 Troubleshooting

### **Problem: "Bucket not found" error**
✅ **FIXED** - Now using correct 'gallery' bucket

### **Problem: Printer not printing**
**Solutions:**
1. Check printer is connected and powered on
2. Verify printer name in settings matches Windows name
3. Check paper is loaded
4. Run test print from admin panel
5. Check printer queue in Windows

### **Problem: Auto-print not working**
**Solutions:**
1. Verify "Stampa automatica" is enabled in settings
2. Check browser console for errors
3. Ensure OrdersAdmin component is running
4. Check Supabase real-time subscriptions are active

### **Problem: Duplicate prints**
**Solution:**
- Auto-print system prevents duplicates
- If issue persists, disable and re-enable auto-print

### **Problem: Print format is wrong**
**Solutions:**
1. Ensure using 80mm thermal paper
2. Check printer DPI settings (203 DPI recommended)
3. Verify printer is set to 80mm width mode

---

## 🧪 Testing

### **Test 1: Manual Print**
1. Go to admin panel → Printer Settings
2. Click "Test Stampante"
3. Check printer prints test receipt

### **Test 2: Auto-Print**
1. Enable auto-print in settings
2. Place a test order from website
3. Check receipt prints automatically
4. Verify all order details are correct

### **Test 3: Browser Print Dialog**
1. System uses browser's print dialog
2. Receipt opens in print preview
3. Sends to default/selected printer

---

## 📝 Technical Details

### **Technologies Used:**
- **Browser Printing API** - Native print functionality
- **Supabase Real-time** - Order notifications
- **React Hooks** - Auto-print logic
- **LocalStorage** - Settings persistence
- **TypeScript** - Type-safe implementation

### **Files Modified:**
1. ✅ `src/services/printerService.ts` - NEW
2. ✅ `src/components/admin/PrinterSettings.tsx` - NEW
3. ✅ `src/hooks/use-auto-print.tsx` - NEW
4. ✅ `src/components/admin/OrdersAdmin.tsx` - MODIFIED
5. ✅ `src/components/admin/PizzeriaAdminPanel.tsx` - MODIFIED
6. ✅ `setup-printer.ps1` - NEW
7. ✅ `src/components/admin/GalleryUploadDialog.tsx` - FIXED

---

## 🎉 Success Checklist

- ✅ Printer connected to computer
- ✅ Epson drivers installed
- ✅ Printer added to Windows
- ✅ Setup script executed successfully
- ✅ Printer name configured in admin panel
- ✅ Auto-print enabled
- ✅ Test print successful
- ✅ Test order prints automatically

---

## 📞 Support

If you need help:
1. Check Windows Device Manager for printer status
2. Verify printer appears in Windows Printers list
3. Test print from Windows (not web) to verify hardware
4. Check browser console for JavaScript errors
5. Review Supabase logs for real-time subscription issues

---

## 🚀 Next Steps

1. **Train Staff**: Show team how system works
2. **Monitor**: Watch first few orders print automatically
3. **Adjust**: Fine-tune receipt format if needed
4. **Backup**: Keep manual print option available

**Your automatic printing system is ready to use!** 🎉🖨️

---

**Last Updated:** 2025-01-09
**Version:** 1.0
**Status:** ✅ Production Ready
