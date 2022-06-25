require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Dns
const dns = require("dns");
  const options = { all : true };
// Checks if a URL's hostname exists (with dns.lookup())
function verifyHostName (urlString) {
  const regexHostName = /(?<=http[s]*:\/\/[www.]*)[a-zA-Z0-9]+.[a-zA-Z]+/i;
  const match = urlString.match(regexHostName);
  const hostName = match !== null ? match[0] : null;
  const isValidHostName = hostName !== null;
  if(isValidHostName) {
    //dns.lookup() function
    //source: https://www.geeksforgeeks.org/node-js-dns-lookup-method/
    dns.lookup(hostName, options, (err, addresses) => {
      err ? 
        console.error(err) 
        : console.log('addresses: %j', addresses)
    });
  }
}

// Replit Database
const Database = require("@replit/database");
const db = new Database();
function setValueByKey(key, value) {
  db.set(key, value).then(() => {
    console.log(key, "was set with", value);
  });
}
function deleteKey(key) {
  db.delete(key).then(() => {
    console.log(key, "was deleted.")
  });
}
function printKeys() {
  db.list().then(keys => {console.log("\nKeys:\n ", keys)});
}
function printAll() {
  db.list().then(keys => {
    console.log("\nIndex Key Value:");
    keys.map((d, i) => {
      db.get(d).then(value => {
        console.log(i, d, value);
      });
    });
  });
}
//deleteKey("");
//printAll();



// Basic Configuration
const port = process.env.PORT || 3000;

// For parsing application/json
  // app.use(express.json());
// Use body-parser to Parse POST Requests
app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

// <link href="/public/style.css" rel="stylesheet" type="text/css" />
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});




// ----- API ENDPOINT: POST /api/shorturl ----- //
// gets URL value from text input with name="url", accessible by clicking in "POST URL" button
// <form action="api/shorturl" method="POST">
// <input id="url_input" type="text" name="url" (...) />
app.route('/api/shorturl')
  .post((req, res) => {
    //url format example: http://www.example.com
    const regex = /http[s]*:\/\/[www.]*[a-z0-9]+.[a-z]+/i;
    const url = req.body.url;
    const urlIsValid = regex.test(url); //checks if the url format is correct

    if(urlIsValid) {
      // if URL is valid,
      // get nextIndex from dB
      db.list().then(keys => {
        const nextIndex = (keys.length + 1);
        const obj = {
            original_url : url,
            short_url : nextIndex
        };
        // create a new database key and value
        db.set(nextIndex, obj).then(() => {
          // and respond json object
          res.json(obj);
        });
      });
    } else { res.json({ error : "invalid url" }); }
  });

// ----- API ENDPOINT: GET /api/shorturl/# ----- //
app.route("/api/shorturl/:index")
  .get((req, res) => {
    const index = Number(req.params.index);
    const isNumber = !isNaN(index);
    // if index is a number and > 0
    if(isNumber && index > 0) {
      // search index in dB and get its value
      db.get(index).then((value) => {
        const isValid = (value !== null && value !== undefined);
        // if a value is found
        if(isValid) {
          // redirect client to original_url
          const url = value.original_url;
          res.redirect(url);
        }
      });
    } else {
      //not a number
      res.json({ error : "invalid url" });
    }
});
// URL: https://boilerplate-project-urlshortener.andrebdinis.repl.co/api/shorturl/#
// where # is a number (1, 2, 3...)




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
