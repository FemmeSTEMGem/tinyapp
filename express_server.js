const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  return Math.random().toString(36).slice(-6)
}

function generateRandomID() {
  return Math.floor(Math.random() * 2000) + 1
}

const emailFinder = function findEmail(email) {
  for (let key in users) {
    if (users[key]["email"] === email)
    return true
  }
  return false
}




//----------------------------------------------GETS-----------------------------------------//

//MAIN PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

//URL DATABASE
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//HELLO PAGE
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//RENDERING URLS INDEX PAGE/////////////////////////////////////////////////////////////////////
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});
//app.get already knows where "urls_index" is because EJS automatically knows to look inside
  //the views directory for any template files that have the extension ".ejs"

//RENDERING URLS NEW PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  }
  res.render("urls_new", templateVars);
});
//this is a GET route to render the urls_new.ejs template in the browser to present the form
  //to the user

  //RENDERING URLS SHOW PAGE
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]]  };
  // console.log("req.params: ", req.params)
  res.render("urls_show", templateVars);
});

//u/:shortURL REDIRECTS TO longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

//urls/:shortURL/edit REDIRECTS TO urls/shortURL
app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL
  res.redirect(`/urls/${shortURL}`)
})

//RENDERING REGISTRATION PAGE
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  }
  res.render("registration", templateVars);
});
//seems to go where it needs to go, but I'm not sure if this is right...I tried removing the
  //parts that mention templateVars but it broke, so I'm leaving it for now


//RENDERING LOGIN FORM PAGE
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  }
  res.render("login_form", templateVars);
});


//----------------------------------------------POSTS-----------------------------------------//

//CREATES SHORT URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  
  res.redirect(`/urls/${shortURL}`);
});

//DELETES A RECORD - REDIRECT TO /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL]

  res.redirect('/urls/');
});

//EDITS A longURL - REDIRECTS TO /urls
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id
  urlDatabase[shortURL] = req.body.longURL

  res.redirect('/urls');
})

//ADDS A COOKIE UPON LOGIN
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username) //res.cookie(cookie_name, cookie_value)

  res.redirect('/urls');
})

//LOGOUT CLEARS THE username COOKIE - REDIRECTS TO /urls
app.post("/logout", (req, res) => {
  res.clearCookie("username")

  res.redirect('/urls');
})

//ADDS A NEW USER - REDIRECTS TO /urls
app.post("/register", (req, res) => {
  const id = generateRandomID();
  const email = req.body.email;
  const password = req.body.password;

  if (req.body.email === "" || req.body.password === "") {
    res.send("404 Error. Email and/or Password was blank")
  } else if (emailFinder(email)) {
    res.send("404 Error. Email is already in use.")
  } else {
  res.cookie('user_id', id)

  const newUser = {
    id: id, 
    email: email,
    password: password
  }
  users[id] = newUser 

  res.redirect('/urls');

  }
})

//----------------------------------------------COOKIES-----------------------------------------//
//cookie-parser serves as Express middleware - it helps us read the values from the cookie
//To set the values on a cookie we can use res.cookie (http://expressjs.com/en/api.html#res.cookie)



//----------------------------------------------LISTEN-----------------------------------------//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});