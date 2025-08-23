# User Roles and Authorization Summary

## Overview of User Roles

1. **Admin**
   - Full access to manage users and view all data.
   - Can perform administrative tasks.

2. **Guard**
   - Limited access focused on security-related tasks.
   - Can view access logs and incident reports.

3. **Resident**
   - Basic access to their own profile and data.
   - Restricted from viewing or modifying other users' data.

## Profiles Table Structure

- **`id`**: UUID referencing the user in the `auth.users` table.
- **`email`**: Unique email address for the user.
- **`role`**: Defines the user's role (default is 'resident').
- **`created_at`**: Timestamp for profile creation.

## Row Level Security (RLS) Policies

- **Public Access**: All profiles are viewable by everyone.
- **User Insert Policy**: Users can insert their own profile.
- **User Update Policy**: Users can update their own profile.

## Guard Role Integration

- The `guards` table is linked to the `auth.users` table.
- Policies ensure guards can only access data relevant to their role.

## Access Control Policies

- **Incident Reports**: Guards can log incidents and view their own activity.
- **Access Logs**: Guards can view access logs related to their community.
- **Emergency Protocols**: Guards have specific permissions to trigger emergency alerts and manage access codes.

## Authentication Mechanism

- **JWT Integration**: The system uses JSON Web Tokens (JWT) for authentication.
- **Role Validation**: The system checks the user's role against defined policies.

## Summary of User Roles and Their Permissions

| Role     | Permissions                                                                 |
|----------|-----------------------------------------------------------------------------|
| Admin    | Full access to all data, manage users, view all incident reports and logs. |
| Guard    | View access logs, log incidents, manage emergency protocols.                |
| Resident | View and update their own profile, limited access to community data.        |

## Conclusion

The system has a well-defined role-based access control structure that ensures users have appropriate permissions based on their roles. The integration of JWT for authentication and the use of RLS policies provide a robust security framework for managing user access and data integrity.
