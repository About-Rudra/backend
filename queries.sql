-- students authentication  --
CREATE TABLE candidate(
id SERIAL PRIMARY KEY,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(100)
);

-- students details table --
CREATE TABLE students(
candidate_id SERIAL PRIMARY KEY,
S_name VARCHAR(100),
email VARCHAR(100) NOT NULL UNIQUE,
Qualification VARCHAR(100),
Contact_No TEXT NOT NULL UNIQUE,
locations VARCHAR (40),
College_Name VARCHAR(100),
Skills TEXT,
Achievements TEXT,
Interested_Internship VARCHAR (40)
);

-- company authentication --
CREATE TABLE recruiter(
id SERIAL PRIMARY KEY,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(100)
);

-- company details table --
create table company(
company_id SERIAL PRIMARY KEY,
company_desciption TEXT,
company_city TEXT,
industry TEXT
);