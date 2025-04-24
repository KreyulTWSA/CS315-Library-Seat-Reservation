CREATE TYPE SEAT_IS AS ENUM ('available', 'booked', 'occupied');
CREATE TYPE RESERVATION_IS AS ENUM ('reserved', 'claimed', 'unclaimed', 'cancelled', 'completed');

CREATE TABLE Seats (
    seat_row CHAR(1) NOT NULL CHECK (seat_row BETWEEN 'A' AND 'Z'),
    seat_col INTEGER NOT NULL CHECK (seat_col > 0),
    seat_id TEXT PRIMARY KEY GENERATED ALWAYS AS (seat_row || seat_col::TEXT) STORED,
    seat_status SEAT_IS NOT NULL DEFAULT 'available'

);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email LIKE '%@iitk.ac.in'),
    username VARCHAR(50) GENERATED ALWAYS AS (split_part(email, '@', 1)) STORED UNIQUE,
    naam VARCHAR(100) NOT NULL,
    hashpassword TEXT NOT NULL,
    user_role VARCHAR(10) NOT NULL CHECK (user_role IN ('student', 'admin')) DEFAULT 'student'
); 

CREATE TABLE Admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Students (
    roll_number INTEGER PRIMARY KEY, 
    user_id INTEGER UNIQUE NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Student_Groups (
   group_id SERIAL PRIMARY KEY,
   group_name VARCHAR(100) UNIQUE NOT NULL 
);

CREATE TABLE Student_Group_Members (
   roll_number INTEGER NOT NULL,
   group_id INTEGER NOT NULL,

   PRIMARY KEY (roll_number, group_id),
   FOREIGN KEY (roll_number) REFERENCES Students(roll_number) ON DELETE CASCADE,
   FOREIGN KEY (group_id) REFERENCES Student_Groups(group_id) ON DELETE CASCADE
);

CREATE TABLE Reservations (
    reservation_id SERIAL PRIMARY KEY,
    roll_number INTEGER NOT NULL,
    seat_id TEXT NOT NULL,
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    reservation_status RESERVATION_IS NOT NULL DEFAULT 'reserved',
    verified_by INT NULL,

    FOREIGN KEY (roll_number) REFERENCES Students(roll_number),
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id),
    FOREIGN KEY (verified_by) REFERENCES Admins(user_id)
);  
 
CREATE TABLE Group_Reservations (
    group_reservation_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    reservation_status RESERVATION_IS NOT NULL DEFAULT 'reserved',
    verified_by INT NULL,

    FOREIGN KEY (group_id) REFERENCES Student_Groups(group_id),
    FOREIGN KEY (verified_by) REFERENCES Admins(user_id)
);

CREATE TABLE Group_Reservation_Seats (
    group_reservation_id INTEGER NOT NULL,
    seat_id TEXT NOT NULL,

    PRIMARY KEY (group_reservation_id, seat_id),
    FOREIGN KEY (group_reservation_id) REFERENCES Group_Reservations(group_reservation_id),
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id)
);

CREATE TABLE library_hours (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    opening_time TIME DEFAULT '08:00',   -- Normal opening time
    closing_time TIME DEFAULT '23:59',   -- Default closing time 
    open_24_7 BOOLEAN DEFAULT false
);

-- Group info lookup
CREATE INDEX idx_sgrp ON Student_Group_Members(group_id, roll_number);

-- Seat
CREATE INDEX idx_seatid ON Seats(seat_id);
CREATE INDEX idx_seatid_status ON Seats(seat_id, seat_status);

-- Library hours lookup
CREATE INDEX idx_libhrs ON library_hours(date);

-- Reservation lookup 
CREATE INDEX idx_resid ON Reservations(reservation_id);
CREATE INDEX idx_resid_seat ON Reservations(reservation_id, seat_id);
CREATE INDEX idx_expiry ON Reservations(reservation_status, expires_at);
CREATE INDEX idx_rollno ON Reservations(roll_number, seat_id);

-- Group reservation
CREATE INDEX idx_grpres ON Group_Reservations(group_reservation_id, reservation_status);

-- Seat reservation inserts and updates
CREATE INDEX idx_grpres_seat ON Group_Reservation_Seats(group_reservation_id, seat_id);

-- Seat Layout
-- Row A
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('A', 1, 'available'),
('A', 2, 'available'),
('A', 3, 'available'),
('A', 4, 'available'),
('A', 5, 'available'),
('A', 6, 'available');

-- Row B
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('B', 1, 'available'),
('B', 2, 'available'),
('B', 3, 'available'),
('B', 4, 'available'),
('B', 5, 'available'),
('B', 6, 'available'),
('B', 7, 'available');  -- Side seat (S)

-- Row C
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('C', 1, 'available'),
('C', 2, 'available'),
('C', 3, 'available'),
('C', 4, 'available'),
('C', 5, 'available'),
('C', 6, 'available'),
('C', 7, 'available');  -- Side seat (S)

-- Row D
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('D', 1, 'available'),
('D', 2, 'available'),
('D', 3, 'available'),
('D', 4, 'available'),
('D', 5, 'available'),
('D', 6, 'available'),
('D', 7, 'available');  -- Side seat (S)

-- Row E
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('E', 1, 'available'),
('E', 2, 'available'),
('E', 3, 'available'),
('E', 4, 'available'),
('E', 5, 'available'),
('E', 6, 'available'),
('E', 7, 'available');  -- Side seat (S)

-- Row F
INSERT INTO Seats (seat_row, seat_col, seat_status) VALUES
('F', 1, 'available'),
('F', 2, 'available'),
('F', 3, 'available'),
('F', 4, 'available'),
('F', 5, 'available'),
('F', 6, 'available');


-- SUPERADMIN ADDITION
INSERT INTO Users (email, naam, hashpassword, user_role)
VALUES (
  'admin_lib@iitk.ac.in',
  'Library Super Admin',
  '$2b$12$BHP22G1CbfNjcANXxm33tOs4PxYy4ObSuc/Vv1S49PSqP.egMDhYe',   -- admin_pwd
  'admin'
);
