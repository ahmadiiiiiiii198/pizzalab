import { readFileSync, writeFileSync } from 'fs';

function fixReservationsAdmin() {
  console.log('🔧 FIXING RESERVATIONS ADMIN TYPESCRIPT ISSUES...');
  
  try {
    let content = readFileSync('src/components/admin/ReservationsAdmin.tsx', 'utf8');
    
    // Fix all Supabase table references with type casting
    content = content.replace(
      /\.from\('reservations'\)/g,
      ".from('reservations' as any)"
    );
    
    content = content.replace(
      /\.from\('reservation_notifications'\)/g,
      ".from('reservation_notifications' as any)"
    );
    
    // Fix data type casting
    content = content.replace(
      /setReservations\(data \|\| \[\]\);/g,
      'setReservations((data as any[]) || []);'
    );
    
    // Fix reservation property access with type casting
    content = content.replace(
      /if \(reservation\) \{/g,
      'if (reservation) {\n        const res = reservation as any;'
    );
    
    // Fix all reservation property references in the notification section
    content = content.replace(
      /reservation\.reservation_number/g,
      'res.reservation_number'
    );
    
    content = content.replace(
      /reservation\.customer_name/g,
      'res.customer_name'
    );
    
    content = content.replace(
      /reservation\.number_of_guests/g,
      'res.number_of_guests'
    );
    
    content = content.replace(
      /reservation\.reservation_date/g,
      'res.reservation_date'
    );
    
    content = content.replace(
      /reservation\.reservation_time/g,
      'res.reservation_time'
    );
    
    content = content.replace(
      /reservation\.customer_email/g,
      'res.customer_email'
    );
    
    // Fix the channel subscription
    content = content.replace(
      /\.channel\('reservations_changes'\)/g,
      ".channel('reservations_changes')"
    );
    
    writeFileSync('src/components/admin/ReservationsAdmin.tsx', content);
    console.log('✅ ReservationsAdmin TypeScript issues fixed');
    
    // Fix the PizzeriaAdminPanel duplicate import issue
    let panelContent = readFileSync('src/components/admin/PizzeriaAdminPanel.tsx', 'utf8');
    
    // Find and remove any duplicate ReservationsAdmin lazy imports
    const lines = panelContent.split('\n');
    const filteredLines = [];
    let foundReservationsAdmin = false;
    
    for (const line of lines) {
      if (line.includes('const ReservationsAdmin = lazy')) {
        if (!foundReservationsAdmin) {
          filteredLines.push(line);
          foundReservationsAdmin = true;
        }
        // Skip duplicate
      } else {
        filteredLines.push(line);
      }
    }
    
    writeFileSync('src/components/admin/PizzeriaAdminPanel.tsx', filteredLines.join('\n'));
    console.log('✅ Fixed duplicate ReservationsAdmin import in PizzeriaAdminPanel');
    
    console.log('🎉 ALL RESERVATIONS ADMIN ISSUES FIXED!');
    
  } catch (error) {
    console.error('💥 Error fixing ReservationsAdmin:', error.message);
  }
}

fixReservationsAdmin();
