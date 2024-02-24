//console.log("GANPATI BAPPA MORAYA");

//packages
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

//middleware, port, salt rounds for encryption 
const app = express();
const port = 5000;
const saltRounds = 10;
env.config();

// session creation 
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
  cors(),
  express.json()
);

// body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

// database connection with securing data using environment variables 
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// user being authenticated using O AUTH
// app.get("/explore", (req, res) => {
//   console.log(req.user);
//   if (req.isAuthenticated()) {
//     res.render("explore");
//   } else {
//     res.redirect("/login");
//   }
// });

// signing up with Google
// app.get(
// "/auth/google",
// passport.authenticate("google", {
//   scope: ["profile", "email"],
// })
// );

// user after being authenticated using O AUTH
// app.get(
// "/auth/google/explore",
// passport.authenticate("google", {
//     successRedirect: "/studentdetails",
//     failureRedirect: "/login",
// })   
// );

// logout page
// app.get("/logout", (req , res ) => {
//   req.logout((err) => {
//     if (err) console.log(err);
//     res.redirect("/");
//   });
// });

//   P  O  S  T         R  E Q  U  E  S  T  S

// login with password
app.post("/login",
  // passport.authenticate("local", {
  //   successRedirect: "/explore", //should redirect to profile page
  //   failureRedirect: "/login",
  // }
  async (req, res) => {
    const email = req.body.email;
    const loginPassword = req.body.password;

    try {
      const checkResult = await db.query("SELECT password FROM candidate WHERE email = $1",
        [email]);

      if (checkResult.rows.length > 0) {
        const hashedPassword = checkResult.rows[0].password;
        console.log("hashedPassword: " + hashedPassword);
        bcrypt.compare(loginPassword, hashedPassword, (err, result) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            // Handle error
            res.sendStatus(500);
          } else if (result) {
            // Passwords match, user authentication successful
            console.log('Password matches!');
            // Proceed with login
            res.sendStatus(200);
          } else {
            // Passwords do not match, user authentication failed
            console.log('Password does not match!');
            // Handle incorrect password
            res.sendStatus(401);
          }
        });

      } else {
        res.sendStatus(401);
      }

    } catch (err) {
      console.log(err);
    }
  }
);

//  student registration 
app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM candidate WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.sendStatus(400);
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          res.sendStatus(500);
        } else {
          const result = await db.query(
            "INSERT INTO candidate (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.sendStatus(200);
            // res.redirect("/details");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});


// CANDIDATE DETAILS POST REQUEST
app.post("/studentdetails", async (req, res) => {
  try {
    const reqPayload = req.body;
    console.log('Data received: ', reqPayload);
    const name = reqPayload.name;
    const email = reqPayload.email;
    const Qualification = reqPayload.qualification;
    const Contact_No = reqPayload.contactno;
    const locations = reqPayload.locations;
    const College_Name = reqPayload.collegename;
    const skills = reqPayload.skills;
    const Achievements = reqPayload.achievements;
    const Interested_Internship = reqPayload.interestedinternship;
    // const name = reqPayload.name;

    const result = await db.query(
      "INSERT INTO students_details ( name ,email , Qualification , Contact_No, locations , College_Name, skills, Achievements, Interested_Internship ) VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9);",
      [name, email, Qualification, Contact_No, locations, College_Name, skills, Achievements, Interested_Internship]
    );
    console.log(result);
    console.log(email);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error posting internship:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

});


// CANDIDATE DETAILS EDIT POST REQUEST


// manual registration verification using password
// passport.use(
//   "local",
//   new Strategy(async function verify(email, password, cb) {
//     try {
//       const result = await db.query("SELECT * FROM candidate WHERE email = $1 ", [
//         email,
//       ]);
//       if (result.rows.length > 0) {
//         const user = result.rows[0];
//         const storedHashedPassword = user.password;
//         bcrypt.compare(password, storedHashedPassword, (err, valid) => {
//           if (err) {
//             //Error with password check
//             console.error("Error comparing passwords:", err);
//             return cb(err);
//           } else {
//             if (valid) {
//               //Passed password check
//               return cb(null, user);
//             } else {
//               //Did not pass password check
//               return cb(null, false);
//             }
//           }
//         });
//       } else {
//         return cb("User not found");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   })
// );

// O AUTH verification 
// passport.use( 
//   "google",
//    new GoogleStrategy(
//     {
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
//     callbackURL: "http://localhost:3000/auth/google/explore",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
//   }, 
//   async (accessToken, refreshToken, profile, cb) => {

//     try {
//     console.log(profile);
//       const result = await db.query("SELECT * FROM candidate WHERE email = $1", [
//       profile.email,
//       ]);
//         if (result.rows.length === 0) {
//           const newUser = await db.query(
//           "INSERT INTO candidate (email, password) VALUES ($1, $2)",
//         [profile.email, "google"] 
//         );
//         return cb(null, newUser.rows[0]);   
//         } else {
//           //Already existing 
//           return cb(null, result.rows[0]);
//         }
//     } catch (err) { 
//       return cb(err);
//     }
//   }
//   )
//   );

//   passport.serializeUser((user, cb) => {
//     cb(null, user);
//   });

//   passport.deserializeUser((user, cb) => {
//     cb(null, user);
//   });


// get company posted internship for student to apply
app.get("/internship", async (req, res) => {
  try {
    // Retrieve specific internship post information from the database
    const internshipInfo = await db.query(
      "SELECT * FROM internship_post;"
    );

    console.log("Internship Information:", internshipInfo.rows);

    res.status(200).json(internshipInfo.rows);
  } catch (error) {
    console.error("Error getting internship information:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// STUDENT APPLY FOR INTERNSHIP POST REQUEST 
app.post("/internship-application", async (req, res) => {
  try {
    const reqPayload = req.body;
    console.log('Internship Application Data received: ', reqPayload);

    const internship_post_id = reqPayload.internshipid;
    const student_name = reqPayload.studentname;
    const qualification = reqPayload.qualification;
    const contact_no = reqPayload.contactno;
    const college_name = reqPayload.collegename;
    const skills_achievements = reqPayload.skills;
    const bio = reqPayload.bio;
    const email = reqPayload.email;
    const locations = reqPayload.locations;
    const where_internship = reqPayload.interestedinternship;

    // Insert the internship application details into the database
    const result = await db.query(
      "INSERT INTO internship_application (internship_post_id, student_name, qualification, contact_no, college_name, skills_achievements, bio, email, locations, where_internship) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);",
      [internship_post_id, student_name, qualification, contact_no, college_name, skills_achievements, bio, email, locations, where_internship]
    );

    console.log(result);
    console.log("Internship applied for candidate with email: " + email);

    // Notify the company about the internship application (you can implement this as needed)

    res.status(200).json({ success: "Internship application submitted successfully!" });
  } catch (error) {
    console.error("Error applying for internship:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get internship applied by student
app.get("/internship-application/candidate/:email", async (req, res) => {
  try {
    const candidate_email = req.params.email;
    // Retrieve specific internship post information from the database
    const applicationInfo = await db.query(
      "SELECT * FROM internship_application WHERE email= $1;", [candidate_email]
    );

    console.log("Applied Candidate Information:", applicationInfo.rows);

    res.status(200).json(applicationInfo.rows);
  } catch (error) {
    console.error("Error getting applied students information:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/studentdetails/:email", async (req, res) => {

  try {
    const email = req.params.email;
    console.log("Email: " + email);

    // Fetch student details from the database based on the student email
    const result = await db.query(
      "SELECT name, email, qualification, contact_no, locations, college_name, skills, achievements, interested_internship, profile_photo FROM students_details WHERE email = $1",
      [email]
    );

    // Check if a student with the given email exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Extract student details from the query result
    const studentDetails = result.rows[0];

    // Send the student details as a response
    res.status(200).json(studentDetails);
    console.log('Student Details:', studentDetails);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



//   C O M P A N Y 

// company home page

// logout page 
// app.get("/logout2", (req, res) => {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     }
//     res.redirect("/");
//   });
// });

// user being authenticated using O AUTH
// app.get("/explore2", (req, res) => {
//   console.log(req.user);
//   if (req.isAuthenticated()) {
//     res.render("explore2");
//   } else {
//     res.redirect("/login2");
//   }
// });

// signing up with Google
// app.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })
// );

// user after being authenticated using O AUTH
// app.get(
//   "/auth/google/explore",
//   passport.authenticate("google", {
//     successRedirect: "/companydetails",
//     failureRedirect: "/login",
//   })
// );

// logout page
// app.get("/logout2", (req, res) => {
//   req.logout((err) => {
//     if (err) console.log(err);
//     res.redirect("/");
//   });
// });

// login with password
// app.post(
//   "/login2",
//   passport.authenticate("local", {
//     successRedirect: "/explore2",
//     failureRedirect: "/login2",
//   })
// );

app.post("/login2",

  async (req, res) => {
    const email = req.body.email;
    const loginPassword = req.body.password;

    try {
      const checkResult = await db.query("SELECT password FROM recruiter WHERE email = $1",
        [email]);

      if (checkResult.rows.length > 0) {
        const hashedPassword = checkResult.rows[0].password;
        console.log("hashedPassword: " + hashedPassword);
        bcrypt.compare(loginPassword, hashedPassword, (err, result) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            // Handle error
            res.sendStatus(500);
          } else if (result) {
            // Passwords match, user authentication successful
            console.log('Password matches!');
            // Proceed with login
            res.sendStatus(200);
          } else {
            // Passwords do not match, user authentication failed
            console.log('Password does not match!');
            // Handle incorrect password
            res.sendStatus(401);
          }
        });

      } else {
        res.sendStatus(401);
      }

    } catch (err) {
      console.log(err);
    }
  }

);


// company registration 
app.post("/register2", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM recruiter WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      // Company with the given email already exists, handle accordingly
      res.sendStatus(400);
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);

          res.sendStatus(500);

        } else {
          const result = await db.query(
            "INSERT INTO recruiter (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.sendStatus(201);

          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});


// manual registration verification using password
// passport.use(
//   "local",
//   new Strategy(async function verify(email, password, cb) {
//     try {
//       const result = await db.query("SELECT * FROM recruiter WHERE email = $1 ", [
//         email,
//       ]);
//       if (result.rows.length > 0) {
//         const user = result.rows[0];
//         const storedHashedPassword = user.password;
//         bcrypt.compare(password, storedHashedPassword, (err, valid) => {
//           if (err) {
//             //Error with password check
//             console.error("Error comparing passwords:", err);
//             return cb(err);
//           } else {
//             if (valid) {
//               //Passed password check
//               return cb(null, user);
//             } else {
//               //Did not pass password check
//               return cb(null, false);
//             }
//           }
//         });
//       } else {
//         return cb("User not found");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   })
// );

// O AUTH verification 
// passport.use(
//   "google",
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/explore2",
//       userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
//     },
//     async (accessToken, refreshToken, profile, cb) => {

//       try {
//         console.log(profile);
//         const result = await db.query("SELECT * FROM recruiter WHERE email = $1", [
//           profile.email,
//         ]);
//         if (result.rows.length === 0) {
//           const newUser = await db.query(
//             "INSERT INTO recruiter (email, password) VALUES ($1, $2)",
//             [profile.email, "google"]
//           );
//           return cb(null, newUser.rows[0]);
//         } else {
//           //Already existing 
//           return cb(null, result.rows[0]);
//         }
//       } catch (err) {
//         return cb(err);
//       }
//     }
//   )
// );

// passport.serializeUser((user, cb) => {
//   cb(null, user);
// });

// passport.deserializeUser((user, cb) => {
//   cb(null, user);
// });





// COMPANY DETAILS POST REQUEST
app.post("/companydetails", async (req, res) => {
  try {
    const reqPayload = req.body;
    console.log('Data received: ', reqPayload);

    const company_name = reqPayload.companyname;
    const qualification_required = reqPayload.qualification;
    const contact_no = reqPayload.contactnumber;
    const position_name = reqPayload.position;
    const skills_required = reqPayload.skills;
    const job_description = reqPayload.jd;
    const email = reqPayload.email;
    const locations = reqPayload.location;
    const interested_domain = reqPayload.interesteddomain;


    const result = await db.query(
      "INSERT INTO company_details (company_name, qualification_required, contact_no, position_name, skills_required, job_description, email, locations, interested_domain) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);",
      [company_name, qualification_required, contact_no, position_name, skills_required, job_description, email, locations, interested_domain]
    );
    console.log(result);
    console.log(email);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error posting internship:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }



});

// COMPANY DETAILS EDIT POST REQUEST


// GET COMPANY DETAILS 
app.get("/companydetails/:email", async (req, res) => {

  try {
    const email = req.params.email;
    console.log("Email: " + email);

    // Fetch company details from the database based on the student email
    const result = await db.query(
      'SELECT company_name, qualification_required, contact_no, position_name, skills_required, job_description, email, locations, interested_domain FROM company_details WHERE email = $1',
      [email]
    );

    // Check if a company with the given email exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Extract company details from the query result
    const companyDetails = result.rows[0];

    // Send the company details as a response
    res.status(200).json(companyDetails);
    console.log('Company Details:', companyDetails);
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// COMPANY POST REQUEST TO POST INTERNSHIP
app.post("/internship", async (req, res) => {
  try {
    const reqPayload = req.body;
    console.log('Internship Posted Data received: ', reqPayload);

    const company_name = reqPayload.companyname;
    const qualification_required = reqPayload.qualification;
    const contact_no = reqPayload.contactnumber;
    const position_name = reqPayload.position;
    const skills_required = reqPayload.skills;
    const job_description = reqPayload.jd;
    const company_email = reqPayload.email;
    const locations = reqPayload.location;
    const interested_domain = reqPayload.interesteddomain;

    // Insert the internship post details into the database
    const result = await db.query(
      "INSERT INTO internship_post (company_name, qualification_required, contact_no, position_name, skills_required, job_description, email, locations, interested_domain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);",
      [company_name, qualification_required, contact_no, position_name, skills_required, job_description, company_email, locations, interested_domain]
    );

    console.log(result);
    console.log("Internship posted with company email: " + company_email);

    // Notify students about the new internship opportunity (you can implement this as needed)

    res.status(200).json({ success: "Internship posted successfully!" });
  } catch (error) {
    console.error("Error posting internship:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get internship posted by the company
app.get("/internship/company/:email", async (req, res) => {
  try {
    const company_email = req.params.email;
    // Retrieve specific internship post information from the database
    const internshipInfo = await db.query(
      "SELECT * FROM internship_post WHERE email = $1;", [company_email]
    );

    console.log("Company specific Internship Information:", internshipInfo.rows);

    res.status(200).json(internshipInfo.rows);
  } catch (error) {
    console.error("Error getting Company specific internship information:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get applications for a specific company posted internship
app.get("/internship-application/:internshipId", async (req, res) => {
  try {
    const internship_id = req.params.internshipId;
    // Retrieve specific internship post information from the database
    const applicationInfo = await db.query(
      "SELECT * FROM internship_application WHERE internship_post_id = $1;", [internship_id]
    );

    console.log("Applications Information:", applicationInfo.rows);

    res.status(200).json(applicationInfo.rows);
  } catch (error) {
    console.error("Error getting applied students information:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//put api for edit page for candidate
// student details PUT REQUEST

app.put("/editstudentdetails/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const reqPayload = req.body;
    console.log('Data received for PUT with email ${email}:', reqPayload);

    // Extract necessary details from the request payload
    // const { name, qualification, contact_no, locations, college_name, skills, achievements, interested_internship } = reqPayload;

    const name = reqPayload.name;
    const qualification = reqPayload.qualification;
    const contact_no = reqPayload.contactno;
    const locations = reqPayload.locations;
    const college_name = reqPayload.collegename;
    const skills = reqPayload.skills;
    const achievements = reqPayload.achievements;
    const interested_internship = reqPayload.interestedinternship;

    // Check if the required fields are present in the request payload
    if (!name || !qualification || !contact_no || !locations || !college_name || !skills || !achievements || !interested_internship) {
      return res.status(400).json({ error: "All fields are required for a PUT request" });
    }

    // Update the student details in the database based on the email in the path
    const result = await db.query(
      "UPDATE students_details SET name = $1, qualification = $2, contact_no = $3, locations = $4, college_name = $5, skills = $6, achievements = $7, interested_internship = $8, email =$9 WHERE email = $9 RETURNING *;",
      [name, qualification, contact_no, locations, college_name, skills, achievements, interested_internship, email]
    );

    const updatedStudent = result.rows[0];
    console.log("Updated student details:", updatedStudent);

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//put api for edit page for company
app.put("/companydetails/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const reqPayload = req.body;
    console.log('Data received for PUT with email ${email}:', reqPayload);

    // Extract necessary details from the request payload
    // const { company_name, qualification_required, contact_no, position_name, skills_required, job_description, locations, interested_domain } = reqPayload;

    const company_name = reqPayload.companyname;
    const qualification_required = reqPayload.qualification;
    const contact_no = reqPayload.contactnumber;
    const position_name = reqPayload.position;
    const skills_required = reqPayload.skills;
    const job_description = reqPayload.jd;
    const company_email = reqPayload.email;
    const locations = reqPayload.location;
    const interested_domain = reqPayload.interesteddomain;

    console.log("company name is" + company_name)

    // Check if the required fields are present in the request payload
    if (!company_name || !qualification_required || !contact_no || !position_name || !skills_required || !job_description || !locations || !interested_domain) {
      return res.status(400).json({ error: "All fields are required for a PUT request" });
    }

    // Update the company details in the database based on the email in the path
    const result = await db.query(
      "UPDATE company_details SET company_name = $1, qualification_required = $2, contact_no = $3, position_name = $4, skills_required = $5, job_description = $6, locations = $7, interested_domain = $8 WHERE email = $9 RETURNING *;",
      [company_name, qualification_required, contact_no, position_name, skills_required, job_description, locations, interested_domain, email]
    );

    const updatedCompany = result.rows[0];
    console.log("Updated company details:", updatedCompany);

    res.status(200).json(updatedCompany);
  } catch (error) {
    console.error("Error updating company details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//post images

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

      
// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Specify the file name
  }
}); 

const upload = multer({ storage });

// Define POST endpoint for uploading images
app.post('/candidateupload/:email', upload.single('image'), async (req, res) => {
  try {
    // If file is not present in the request
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileName = req.file.filename;
    const email = req.params.email;
    console.log("Request email: " + email);
    console.log("File name: " + fileName);
  
    // // Get the directory name of the current module file
    // const __dirname = dirname(fileURLToPath(import.meta.url));
    // // File path of the uploaded image
    // const filePath = join(__dirname, 'uploads', req.file.filename);

    // Insert the file path into the database
    const result = await db.query('UPDATE students_details SET profile_photo = $1 WHERE email = $2;',
      [fileName, email]);
    res.status(201).json({ message: 'File uploaded successfully', imageName: fileName });
  
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));