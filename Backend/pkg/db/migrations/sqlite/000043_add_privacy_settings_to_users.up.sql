ALTER TABLE users ADD COLUMN birthday_privacy VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE users ADD COLUMN gender_privacy VARCHAR(20) DEFAULT 'everyone';