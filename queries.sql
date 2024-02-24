-- students registeration --
CREATE TABLE candidate(
id SERIAL ,
email VARCHAR(100) NOT NULL UNIQUE PRIMARY KEY,
password VARCHAR(100)
)

-- students details table --
CREATE TABLE students_details(
candidate_id SERIAL ,
name VARCHAR(40),
email VARCHAR(100) NOT NULL UNIQUE PRIMARY KEY,
qualification VARCHAR(100),
contact_no TEXT NOT NULL UNIQUE,
locations VARCHAR (40),
college_name VARCHAR(100),
skills TEXT,
achievements TEXT,
Interested_Internship VARCHAR (40),
profile_photo VARCHAR(300)
)

-- company authentication --
CREATE TABLE recruiter(
id SERIAL ,
email VARCHAR(100) NOT NULL UNIQUE PRIMARY KEY,
password VARCHAR(100)
)

-- company details table --
create table company(
company_id SERIAL,
company_name  VARCHAR(40),
qualification_required  VARCHAR(100),
contact_no TEXT NOT NULL UNIQUE,
position_name VARCHAR(40),
skills_required TEXT,
job_description VARCHAR(200),
email VARCHAR(100) NOT NULL UNIQUE PRIMARY KEY,
locations VARCHAR (40),
interested_domain VARCHAR (40)
)


-- Applying for internship table--
CREATE TABLE internship_application (
  application_id SERIAL PRIMARY KEY,
  internship_post_id INT,
  student_name VARCHAR(255),
  qualification VARCHAR(255),
  contact_no VARCHAR(15),
  college_name VARCHAR(255),
  skills_achievements TEXT,
  bio TEXT,
  email VARCHAR(255) NOT NULL,
  locations VARCHAR(255),
  where_internship VARCHAR(255),
  CONSTRAINT fk_intership_post FOREIGN KEY(internship_post_id) REFERENCES internship_post(internship_id)
);


-- Posting Internship --
CREATE TABLE internship_post (
  internship_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  qualification_required VARCHAR(255),
  contact_no VARCHAR(15),
  position_name VARCHAR(255),
  skills_required TEXT,
  job_description TEXT,
  email VARCHAR(255) NOT NULL,
  locations VARCHAR(255),
  interested_domain VARCHAR(255)
);

-- orignal query
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

