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

function generateRandomString() {
  let answer = Math.random().toString(36).slice(-6)
  return answer
}



//----------------------------------------------GETS-----------------------------------------//


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"], };
  res.render("urls_index", templateVars);
});
//app.get already knows where "urls_index" is because EJS automatically knows to look inside
  //the views directory for any template files that have the extension ".ejs"

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
//this is a GET route to render the urls_new.ejs template in the browser to present the form
  //to the user

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"], };
  // console.log("req.params: ", req.params)
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL
  res.redirect(`/urls/${shortURL}`)
})



//----------------------------------------------POSTS-----------------------------------------//
app.post("/urls", (req, res) => {
  // console.log("req.body: ", req.body);  // Log the POST request body to the console
  
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log("req.body: ", req.body);  // Log the POST request body to the console
  const shortURL = req.params.shortURL
  
  delete urlDatabase[shortURL]

  res.redirect('/urls/');
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id
  urlDatabase[shortURL] = req.body.longURL

  res.redirect('/urls');
})
//Route handling for longURL editing

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username) //res.cookie(cookie_name, cookie_value)

  res.redirect('/urls');
})


//----------------------------------------------COOKIES-----------------------------------------//
//cookie-parser serves as Express middleware - it helps us read the values from the cookie
//To set the values on a cookie we can use res.cookie (http://expressjs.com/en/api.html#res.cookie)



//----------------------------------------------LISTEN-----------------------------------------//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});