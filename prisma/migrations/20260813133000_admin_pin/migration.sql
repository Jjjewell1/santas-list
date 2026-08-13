-- Add a PIN hash for the parent login (scrypt, same format as passwordHash).
ALTER TABLE "Admin" ADD COLUMN "pinHash" TEXT;
