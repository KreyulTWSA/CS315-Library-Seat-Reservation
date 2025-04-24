Library Seat Reservation System (CLI)
====================================
This project was developed as part of my **CS315: Principles of Database Systems** course at IIT Kanpur.  
It is a command-line based solution for managing library seat bookings at IITK. Students can reserve seats in advance with QR verification, while admins can oversee reservations and adjust library hours.

Features
--------
- **Student Portal**:
  - Real-time seat availability
  - Individual/group bookings
  - QR code validation
  - Reservation history

- **Admin Portal**:
  - Live seat monitoring
  - QR-based check-ins
  - Library hour adjustments
  - Student booking lookup

Setup Instructions
------------------

### Prerequisites
- Node.js (v16+)
- PostgreSQL (local or Supabase)
- npm

### Installation
1. **Clone the repository**:
   ```
   git clone https://github.com/KreyulTWSA/CS315-Library-Seat-Reservation.git
   cd CS315-Library-Seat-Reservation/backend
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Configure environment**:
   - Create `.env` file in `/backend` with:
     
   ```
     DB_HOST=your_postgres_host
     DB_PORT=your_postgres_port
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=your_database_name
     JWT_SECRET=your_jwt_secret
     ```
   - For Supabase: Use credentials from your project dashboard

5. **Initialize database**:
   - Run `schema.sql` in your PostgreSQL client to create tables

Running the System
------------------
```
cd backend
node cli/cli.js
```

Usage
-----

### Main Menu
```
Welcome! What do you want to do?
> Login as Student 
  Login as Admin 
  Signup as Student 
  Create a New Admin (Super Admin only) 
  Exit
```
### Student Dashboard
```
Student Dashboard - Choose an action:
> View Seat Layout 
  Book a Seat
  Create a Group
  Book Group Reservation
  View Reservation History
  Delete an active Reservation
  End the Session
  Logout
```

### Admin Dashboard
```
Admin Dashboard - Select an option:
> View Seat Layout 
  Update Library Hours
  Claim Reservation (QR)
  Claim Group Reservation (QR)
  View Student Reservation History
  Logout
```

Troubleshooting
---------------
- Ensure PostgreSQL is running before starting the CLI
- Verify `.env` credentials match your database
- Delete `node_modules` and re-run `npm install` if dependency errors occur

