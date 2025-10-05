# Admin Credentials Management Guide

## Overview

The PizzaLab admin panel now includes the ability to change the admin username and password directly from within the admin panel. This feature provides enhanced security and flexibility for managing admin access.

## How to Access

1. Log into the admin panel using your current credentials
2. Navigate to **Impostazioni Generali** (General Settings)
3. Click on the **Sicurezza** (Security) tab
4. You'll see the Admin Security Settings section

## How to Change Credentials

### Step-by-Step Process

1. **Current Password**: Enter your current password for verification
2. **New Username**: Enter the new username (minimum 3 characters)
3. **New Password**: Enter the new password (minimum 6 characters)
4. **Confirm Password**: Re-enter the new password to confirm
5. Click **Update Credentials**

### Security Features

- **Current Password Verification**: You must enter your current password to make changes
- **Password Strength**: Minimum 6 characters required
- **Confirmation**: Password must be entered twice to prevent typos
- **Real-time Validation**: Form validates input before submission

## Authentication Priority

The system now uses the following authentication priority:

1. **Database Credentials** (Primary) - Credentials set through the admin panel
2. **Fallback Credentials** (Emergency) - Hard-coded credentials for emergency access

### Current Default Credentials

- **Username**: `admin`
- **Password**: `persian123`

### Emergency Fallback Credentials

If you get locked out, you can still access the admin panel using these hard-coded credentials:

- **Usernames**: `admin`, `pizzeria`, `gallery`
- **Passwords**: `admin123`, `pizzeria2024`, `admin`

## Important Security Notes

### ⚠️ Security Warnings

1. **Remember Your Credentials**: Make sure to remember your new username and password
2. **Secure Storage**: Store your credentials in a secure location
3. **Regular Updates**: Consider changing your credentials periodically
4. **Emergency Access**: Keep the fallback credentials secure for emergency access

### 🔒 Best Practices

1. **Strong Passwords**: Use passwords with a mix of letters, numbers, and symbols
2. **Unique Credentials**: Don't reuse passwords from other accounts
3. **Regular Changes**: Update credentials every 3-6 months
4. **Secure Environment**: Only change credentials from a secure, trusted device

## Technical Details

### Database Storage

- Credentials are stored in the `settings` table with key `adminCredentials`
- Passwords are stored in plain text (consider implementing hashing in production)
- Changes are immediately synced to both localStorage and Supabase database

### Authentication Flow

1. System first checks database credentials
2. If database credentials match, login is successful
3. If not, system falls back to hard-coded credentials
4. If neither match, login fails

### Error Handling

- Form validation prevents invalid inputs
- Database errors are handled gracefully
- User receives clear feedback on success/failure
- Fallback mechanisms ensure admin access is maintained

## Troubleshooting

### Common Issues

**Q: I forgot my new credentials, what do I do?**
A: Use the emergency fallback credentials listed above to regain access.

**Q: The form says "Current password is incorrect"**
A: Make sure you're entering the password that's currently stored in the database, not the fallback credentials.

**Q: Changes aren't saving**
A: Check your internet connection and ensure the Supabase database is accessible.

**Q: I can't access the Security tab**
A: Make sure you're logged in as an admin and have navigated to Impostazioni Generali.

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your internet connection
3. Try using fallback credentials to regain access
4. Contact technical support if problems persist

## Future Enhancements

Potential future improvements:

- Password hashing for enhanced security
- Two-factor authentication
- Session management
- Audit logging for credential changes
- Password complexity requirements
- Account lockout after failed attempts

---

**Last Updated**: September 2025
**Version**: 1.0
