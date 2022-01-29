//TODO: Fix "Cannot set headers after they are sent to the client" error - login/logout and/or register

//------------------------------------------MODULES/LIBRARIES-----------------------------------------//

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bcrypt = require('bcryptjs');


//----------------------------------------------STORAGE-----------------------------------------//


const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      user_id: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      user_id: "user2RandomID"
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

const findUserByEmail = (email, database) => {
  for (let user_id in database) {
    const user = database[user_id]
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
    
    if (foundRecord.user_id === id) {
      filteredDatabase[shortURL] = foundRecord
    }
  })
  return filteredDatabase
}

const rejectUnauthenticatedUser = (req, res) => {
  const user_id = req.session.user_id

  if (!user_id) {
    return res.send('Please login first')
  }
}

const rejectUnauthorisedUser = (req, res) => {
  const shortURL = req.params.shortURL
  const user_id = req.session.user_id
  const foundRecord = urlDatabase[shortURL]

  if (!foundRecord || foundRecord.user_id !== user_id) {
    return res.send('Not found')
  }

  if (user_id !== foundRecord.user_id) {
    return res.send('Unauthorised access')
  }
}


//----------------------------------------------GETS-----------------------------------------//


//MAIN PAGE
app.get("/", (req, res) => {
  return res.send("Hello, welcome to the Main Page!");
});


//URL DATABASE
app.get("/urls.json", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  return res.json(urlsForUser(req.session.user_id));
});


//HELLO PAGE
app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//RENDERING URLS INDEX PAGE
app.get("/urls", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const user_id = req.session.user_id
  const templateVars = { urls: urlsForUser(user_id), user: users[user_id] };
  
  return res.render("urls_index", templateVars);    
});


//RENDERING URLS NEW PAGE
app.get("/urls/new", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const currentUser = users[req.session.user_id];
  const templateVars = { user: currentUser }
  
  return res.render("urls_new", templateVars);
});


//RENDERING URLS SHOW PAGE - in Compass, this is referred to as /urls/:id
app.get("/urls/:shortURL", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  const shortURL = req.params.shortURL
  const foundRecord = urlsForUser(req.session.user_id)
  
  if (!foundRecord) {
    return res.send(`Unable to find a record with short URL ${shortURL}.`)
  }
  
  const templateVars = {
    shortURL,
    longURL: foundRecord.longURL,
    user: users[req.session.user_id]
  };
  
  return res.render("urls_show", templateVars);
});


//u/:shortURL REDIRECTS TO longURL
app.get("/u/:shortURL", (req, res) => {  
  const longURL = urlDatabase[req.params.shortURL].longURL

  return res.redirect(longURL);
});


//urls/:shortURL/edit REDIRECTS TO urls/shortURL
app.get("/urls/:shortURL/edit", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)
  
  const shortURL = req.params.shortURL
  
  return res.redirect(`/urls/${shortURL}`)
})


//RENDERING REGISTRATION PAGE
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id]  }
  return res.render("registration", templateVars);
});


//RENDERING LOGIN FORM PAGE
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id]  }
  return res.render("login_form", templateVars);
});


//----------------------------------------------POSTS-----------------------------------------//

//CREATES SHORT URL
app.post("/urls", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  
  const shortURL = generateRandomString()
  const newDatabaseEntry = {
    longURL: req.body.longURL,
    user_id: req.session.user_id
  }
  urlDatabase[shortURL] = newDatabaseEntry

  return res.redirect(`/urls/${shortURL}`);
});


//DELETES A RECORD - REDIRECT TO /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  const shortURL = req.params.shortURL

  delete urlDatabase[shortURL]

  return res.redirect('/urls/');
});


//EDITS A longURL - REDIRECTS TO /urls
app.post("/urls/:shortURL", (req, res) => {
  rejectUnauthenticatedUser(req, res)
  rejectUnauthorisedUser(req, res)

  const shortURL = req.params.shortURL

  urlDatabase[shortURL].longURL = req.body.longURL

  return res.redirect('/urls');
})


//LOGIN USER + ADDS A COOKIE
app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = findUserByEmail(email, users)
  
  if (email === "" || password === "") {
    return res.send("404 Error. Email and/or Password was blank")
  }

  // if (!user || user.password !== password) {
    if (!user || !bcrypt.compare(password, user.password)) {
      return res.send("403 Error")
  }

  req.session.user_id = user.id

  return res.redirect('/urls');
})


//LOGOUT CLEARS THE user_id COOKIE - REDIRECTS TO /urls
app.post("/logout", (req, res) => {
  req.session = null

  return res.redirect('/urls');
})


//ADDS A NEW USER - REDIRECTS TO /urls
app.post("/register", (req, res) => {
  const id = generateRandomID();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = findUserByEmail(email, users)

  if (email === "" || password === "") {
    return res.send("404 Error. Email and/or Password was blank")
  }
  
  if (user) {
    return res.send("404 Error. Email is already in use.")
  }

  if (!user) {
    const user = id
  
    const newUser = {
    id,
    email,
    password: hashedPassword,
    }

    users[id] = newUser 

    req.session.user_id = user.id

    return res.redirect('/urls');
  }
})


//----------------------------------------------LISTEN-----------------------------------------//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});