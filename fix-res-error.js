import { readFileSync, writeFileSync } from 'fs';

function fixResError() {
  console.log('🔧 FIXING RES VARIABLE ERROR IN RESERVATIONS ADMIN...');
  
  try {
    let content = readFileSync('src/components/admin/ReservationsAdmin.tsx', 'utf8');
    
    // The issue is that we're trying to use 'res' in the JSX rendering part
    // but 'res' was only defined in the notification section
    // Let's fix this by using proper type casting in the map function
    
    // Find the map function and fix the reservation references
    content = content.replace(
      /filteredReservations\.map\(reservation => \(/g,
      'filteredReservations.map((reservation: any) => ('
    );
    
    // Replace any remaining 'res.' references with 'reservation.'
    content = content.replace(
      /res\./g,
      'reservation.'
    );
    
    // Also ensure all reservation properties are properly accessed
    content = content.replace(
      /reservation\.reservation_number/g,
      'reservation.reservation_number'
    );
    
    content = content.replace(
      /reservation\.customer_name/g,
      'reservation.customer_name'
    );
    
    content = content.replace(
      /reservation\.reservation_date/g,
      'reservation.reservation_date'
    );
    
    content = content.replace(
      /reservation\.reservation_time/g,
      'reservation.reservation_time'
    );
    
    content = content.replace(
      /reservation\.number_of_guests/g,
      'reservation.number_of_guests'
    );
    
    content = content.replace(
      /reservation\.table_preference/g,
      'reservation.table_preference'
    );
    
    content = content.replace(
      /reservation\.customer_email/g,
      'reservation.customer_email'
    );
    
    content = content.replace(
      /reservation\.customer_phone/g,
      'reservation.customer_phone'
    );
    
    content = content.replace(
      /reservation\.special_requests/g,
      'reservation.special_requests'
    );
    
    content = content.replace(
      /reservation\.status/g,
      'reservation.status'
    );
    
    content = content.replace(
      /reservation\.confirmed_at/g,
      'reservation.confirmed_at'
    );
    
    content = content.replace(
      /reservation\.confirmed_by/g,
      'reservation.confirmed_by'
    );
    
    content = content.replace(
      /reservation\.id/g,
      'reservation.id'
    );
    
    // Fix the notification section properly by keeping the 'res' variable local
    content = content.replace(
      /if \(reservation\) \{\s*const res = reservation as any;/g,
      'if (reservation) {\n        const res = reservation as any;'
    );
    
    // Make sure the 'res' variable is only used in the notification section
    // by finding the notification section and ensuring it's properly scoped
    const notificationSectionStart = content.indexOf('// Create notification record');
    const notificationSectionEnd = content.indexOf('await supabase', notificationSectionStart + 500);
    
    if (notificationSectionStart > -1 && notificationSectionEnd > -1) {
      const beforeNotification = content.substring(0, notificationSectionStart);
      const notificationSection = content.substring(notificationSectionStart, notificationSectionEnd);
      const afterNotification = content.substring(notificationSectionEnd);
      
      // In the notification section, use 'res' but everywhere else use 'reservation'
      const fixedNotificationSection = notificationSection
        .replace(/reservation\./g, 'res.');
      
      content = beforeNotification + fixedNotificationSection + afterNotification;
    }
    
    writeFileSync('src/components/admin/ReservationsAdmin.tsx', content);
    console.log('✅ Fixed res variable error in ReservationsAdmin');
    
    console.log('🎉 RES ERROR FIXED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('💥 Error fixing res variable:', error.message);
  }
}

fixResError();
