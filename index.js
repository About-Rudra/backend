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

//   STUDENTS

// home page 
app.get("/", (req, res) => {
    res.render("home");
  });

// are you a 
app.get("/areyoua ", (req, res) => {
  res.render("are you a ");
});

// redirect of candidate
app.get("/candidate ", (req, res) => {
  res.render("register");
});


// login page
  app.get("/login", (req, res) => {
    res.render("login");
  });
  
// register page 
  app.get("/register", (req, res) => {
    res.render("register");
  });

// logout page 
 // app.get("/logout", (req, res) => {
  //  req.logout(function (err) {
   //   if (err) {
   //     return next(err);
  //    }
    // res.redirect("/");
  //  });
  //})
  

// user being authenticated using O AUTH
  app.get("/explore", (req, res) => {
    console.log(req.user);
    if (req.isAuthenticated()) {
      res.render("explore");
    } else {
      res.redirect("/login");
    }
  });
  
// signing up with Google
  app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
  );

// user after being authenticated using O AUTH
  app.get(
  "/auth/google/explore",
  passport.authenticate("google", {
      successRedirect: "/studentdetails",
      failureRedirect: "/login",
  })   
  );

// logout page
  app.get("/logout", (req , res ) => {
    req.logout((err) => {
      if (err) console.log(err);
      res.redirect("/");
    });
  });

//   P  O  S  T         R  E Q  U  E  S  T  S

// login with password
  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/explore",
      failureRedirect: "/login",
    })
  );

//  student registration 
app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM candidate WHERE email = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/login");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO candidate (email, password) VALUES ($1, $2) RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/details");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });




// CANDIDATE DETAILS POST REQUEST
//8.5 solution.js 90 line





app.post("/studentdetails", async (req, res) => {
  const reqPayload = req.body;
  console.log('Data received: ', reqPayload);
  const email = reqPayload.email;
  const Qualification = reqPayload.qualification;
  const Contact_No = reqPayload.contactno;
  const locations = reqPayload.locations ;
  const College_Name = reqPayload.collegename;
  const skills = reqPayload.skills;
  const Achievements = reqPayload.achievements;
  const Interested_Internship = reqPayload.interestedinternship;
  const name = reqPayload.name;

  const result = await db.query(
    "INSERT INTO students ( email , Qualification , Contact_No, locations , College_Name, skills, Achievements, Interested_Internship, s_name) VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9);",
    [ email, Qualification, Contact_No, locations, College_Name, skills, Achievements, Interested_Internship,name]
  );
console.log(result);
console.log(email);
 // const id = result.rows[0].id;
 // currentUserId = id;

 res.sendStatus(200);
//  res.redirect("/explore");
});



// CANDIDATE DETAILS EDIT POST REQUEST






// manual registration verification using password
  passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM candidate WHERE email = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );

  // O AUTH verification 
  passport.use( 
    "google",
     new GoogleStrategy(
      {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
      callbackURL: "http://localhost:3000/auth/google/explore",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    }, 
    async (accessToken, refreshToken, profile, cb) => {
      
      try {
      console.log(profile);
        const result = await db.query("SELECT * FROM candidate WHERE email = $1", [
        profile.email,
        ]);
          if (result.rows.length === 0) {
            const newUser = await db.query(
            "INSERT INTO candidate (email, password) VALUES ($1, $2)",
          [profile.email, "google"] 
          );
          return cb(null, newUser.rows[0]);   
          } else {
            //Already existing 
            return cb(null, result.rows[0]);
          }
      } catch (err) { 
        return cb(err);
      }
    }
    )
    );
    
    passport.serializeUser((user, cb) => {
      cb(null, user);
    });
    
    passport.deserializeUser((user, cb) => {
      cb(null, user);
    });










//   C O M P A N Y 

// company home page

// redirect to recruiter 
app.get("/recruiter ", (req, res) => {
    res.render("register2");
  });
  
  // login page
    app.get("/login2", (req, res) => {
      res.render("login2");
    });
    
  // register page 
    app.get("/register2", (req, res) => {
      res.render("register2");
    });
  
   
  // logout page 
    app.get("/logout2", (req, res) => {
      req.logout(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    });
    
  // user being authenticated using O AUTH
    app.get("/explore2", (req, res) => {
      console.log(req.user);
      if (req.isAuthenticated()) {
        res.render("explore2");
      } else {
        res.redirect("/login2");
      }
    });
    
  // signing up with Google
    app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
    );
  
  // user after being authenticated using O AUTH
    app.get(
    "/auth/google/explore",
    passport.authenticate("google", {
        successRedirect: "/companydetails",
        failureRedirect: "/login",
    })   
    );
  
  // logout page
    app.get("/logout2", (req , res ) => {
      req.logout((err) => {
        if (err) console.log(err);
        res.redirect("/");
      });
    });
  
  // login with password
    app.post(
      "/login2",
      passport.authenticate("local", {
        successRedirect: "/explore2",
        failureRedirect: "/login2",
      })
    );
  
   // company details page 





// company registration 
app.post("/register2", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM recruiter WHERE email = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/login2");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO recruiter (email, password) VALUES ($1, $2) RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/companydetails");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

// manual registration verification using password
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM recruiter WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

 // O AUTH verification 
 passport.use( 
  "google",
   new GoogleStrategy(
    {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: "http://localhost:3000/auth/google/explore2",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  }, 
  async (accessToken, refreshToken, profile, cb) => {
    
    try {
    console.log(profile);
      const result = await db.query("SELECT * FROM recruiter WHERE email = $1", [
      profile.email,
      ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
          "INSERT INTO recruiter (email, password) VALUES ($1, $2)",
        [profile.email, "google"] 
        );
        return cb(null, newUser.rows[0]);   
        } else {
          //Already existing 
          return cb(null, result.rows[0]);
        }
    } catch (err) { 
      return cb(err);
    }
  }
  )
  );
  
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });





// COMPANY DETAILS POST REQUEST




 app.post("/companydetails", async (req, res) => {

    const company_desciption= req.body.jd;
    const company_city = req.body.location;
    const industry = req.body.interesteddomain;

    const result = await db.query(
      "INSERT INTO company (company_desciption, company_city, industry ) VALUES( $1, $2, $3);",
      [ company_desciption, company_city, industry]
    );
  console.log(result);
   // const id = result.rows[0].id;
   // currentUserId = id;
  
    // res.redirect("/explore2");
  });

// COMPANY DETAILS EDIT POST REQUEST


    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    