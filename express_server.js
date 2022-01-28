//------------------------------------------MODULES/LIBRARIES-----------------------------------------//

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser())


//----------------------------------------------STORAGE-----------------------------------------//


const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "a@a.com", 
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "b@b.com", 
    password: "123"
  }
}

//----------------------------------------------HELPER FUNCTIONS-----------------------------------------//


function generateRandomString() {
  return Math.random().toString(36).slice(-6)
}

function generateRandomID() {
  return Math.floor(Math.random() * 2000) + 1
}

const findUserByEmail = (email) => {
  for (let userID in users) {
    const user = users[userID]
    if (user.email === email)
    return user
  }
  return null
}

const urlsForUser = (id) => {
  const filteredDatabase = { }
  const shortURLs = Object.keys(urlDatabase)

  shortURLs.forEach((shortURL) => {
    const foundRecord = urlDatabase[shortURL];
    
    if (foundRecord.userID === id) {
      filteredDatabase[shortURL] = foundRecord
    }
  })
  return filteredDatabase
}

const rejectUnauthenticatedUser = (req, res) => {
  const userID = req.cookies["user_id"]

  if (!userID) {
    return res.send('Please login first')
  }
}

const rejectUnauthorisedUser = (req, res) => {
  const shortURL = req.params.shortURL
  const userID = req.cookies["user_id"]
  const foundRecord = urlDatabase[shortURL]

  if (!foundRecord || foundRecord.userID !== userID) {
    return res.send('Not found')
  }

  if (userID !== foundRecord.userID) {
    return res.send('Unauthorised access')
  }
}


//----------------------------------------------GETS-----------------------------------------//


//MAIN PAGE
app.get("/", (req, res) => {
  res.send("Hello, welcome to the Main Page!");
});


//URL DATABASE
app.get("/urls.json", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  res.json(urlsForUser(req.cookies["user_id"]));
});


//HELLO PAGE
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//RENDERING URLS INDEX PAGE
app.get("/urls", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const userID = req.cookies["user_id"]
  const templateVars = { urls: urlsForUser(userID), user: users[userID] };
  
  res.render("urls_index", templateVars);    
});


//RENDERING URLS NEW PAGE
app.get("/urls/new", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = { user: currentUser }
  
  res.render("urls_new", templateVars);
});


//RENDERING URLS SHOW PAGE - in Compass, this is referred to as /urls/:id
app.get("/urls/:shortURL", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  const shortURL = req.params.shortURL
  const foundRecord = urlsForUser(req.cookies["user_id"])
  
  if (!foundRecord) {
    return res.send(`Unable to find a record with short URL ${shortURL}.`)
  }
  
  const templateVars = {
    shortURL,
    longURL: foundRecord.longURL,
    user: users[req.cookies["user_id"]]
  };
  
  res.render("urls_show", templateVars);
});


//u/:shortURL REDIRECTS TO longURL
app.get("/u/:shortURL", (req, res) => {
  // TODO: Redirect to a generic error page if a record can't be found.
  
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});


//urls/:shortURL/edit REDIRECTS TO urls/shortURL
app.get("/urls/:shortURL/edit", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)
  
  const shortURL = req.params.shortURL
  
  res.redirect(`/urls/${shortURL}`)
})


//RENDERING REGISTRATION PAGE
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  }
  res.render("registration", templateVars);
});


//RENDERING LOGIN FORM PAGE
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]  }
  res.render("login_form", templateVars);
});


//----------------------------------------------POSTS-----------------------------------------//

//CREATES SHORT URL
app.post("/urls", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const shortURL = generateRandomString()
  const newDatabaseEntry = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }
  urlDatabase[shortURL] = newDatabaseEntry

  res.redirect(`/urls/${shortURL}`);
});


//DELETES A RECORD - REDIRECT TO /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  const shortURL = req.params.shortURL

  delete urlDatabase[shortURL]

  res.redirect('/urls/');
});


//EDITS A longURL - REDIRECTS TO /urls
app.post("/urls/:shortURL", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  urlDatabase[shortURL].longURL = req.body.longURL

  res.redirect('/urls');
})


//ADDS A COOKIE UPON LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = findUserByEmail(email)
  
  if (email === "" || password === "") {
    res.send("404 Error. Email and/or Password was blank")
  }

  if (!user || user.password !== password) {
      res.send("403 Error")
  }

  res.cookie('user_id', user.id)
  res.redirect('/urls');
})


//LOGOUT CLEARS THE user_id COOKIE - REDIRECTS TO /urls
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")

  res.redirect('/urls');
})


//ADDS A NEW USER - REDIRECTS TO /urls
app.post("/register", (req, res) => {
  const id = generateRandomID();
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email)

  if (email === "" || password === "") {
    return res.send("404 Error. Email and/or Password was blank")
  }
  
  if (user) {
    return res.send("404 Error. Email is already in use.")
  }

  const newUser = {
  id,
  email,
  password,
  }

  users[id] = newUser 

  res.cookie('user_id', newUser.id)

  res.redirect('/urls');
})


//----------------------------------------------LISTEN-----------------------------------------//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});