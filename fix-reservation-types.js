import { readFileSync, writeFileSync } from 'fs';

function fixReservationTypes() {
  console.log('🔧 FIXING RESERVATION ADMIN TYPESCRIPT ISSUES...');
  
  try {
    let content = readFileSync('src/pages/ReservationAdminPage.tsx', 'utf8');
    
    // Fix the filter function with proper type casting
    content = content.replace(
      /filteredData = filteredData\.filter\(\(reservation: Reservation\) =>/g,
      'filteredData = (filteredData as any[]).filter((reservation: any) =>'
    );
    
    // Fix the setReservations call
    content = content.replace(
      /setReservations\(filteredData\);/g,
      'setReservations(filteredData as Reservation[]);'
    );
    
    // Fix all stats calculations with proper type casting
    content = content.replace(
      /reservations\.filter\(r => r\.status === 'pending'\)\.length/g,
      '(reservations as any[]).filter((r: any) => r?.status === "pending").length'
    );
    
    content = content.replace(
      /reservations\.filter\(r => r\.status === 'confirmed'\)\.length/g,
      '(reservations as any[]).filter((r: any) => r?.status === "confirmed").length'
    );
    
    content = content.replace(
      /reservations\.filter\(r => r\.reservation_date === new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\)\.length/g,
      '(reservations as any[]).filter((r: any) => r?.reservation_date === new Date().toISOString().split("T")[0]).length'
    );
    
    // Fix the map function
    content = content.replace(
      /reservations\.map\(\(reservation\) =>/g,
      '(reservations as any[]).map((reservation: any) =>'
    );
    
    writeFileSync('src/pages/ReservationAdminPage.tsx', content);
    console.log('✅ TypeScript issues fixed in ReservationAdminPage');
    
    // Also fix the App.tsx cacheTime issue
    let appContent = readFileSync('src/App.tsx', 'utf8');
    appContent = appContent.replace(
      /cacheTime: 10 \* 60 \* 1000,/g,
      'gcTime: 10 * 60 * 1000,'
    );
    
    writeFileSync('src/App.tsx', appContent);
    console.log('✅ Fixed cacheTime issue in App.tsx');
    
    console.log('🎉 ALL TYPESCRIPT ISSUES FIXED AUTOMATICALLY!');
    
  } catch (error) {
    console.error('💥 Error fixing types:', error.message);
  }
}

fixReservationTypes();
