require('dotenv').config();
const express = require('express');
const app = express();
const Student = require('./models/student')
const mongoose = require('mongoose');
const connectDb = () => {
    return mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
};
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


const user_schema = {
  0 : { name: "email",            type: "string",   isArray: false },
  1 : { name: "discord",          type: "string",   isArray: false },
  2 : { name: "name",             type: "string",   isArray: false },
  3 : { name: "region",           type: "integer",  isArray: false }, //3 options
  4 : { name: "location",         type: "string",   isArray: false }, 
  5 : { name: "pronouns",         type: "string",   isArray: false }, //bullet option with other ______ 
  6 : { name: "introduction",     type: "string",   isArray: false },
  7 : { name: "five_years",       type: "string",   isArray: false },
  8 : { name: "goals",            type: "integer",  isArray: true  },
  9 : { name: "track",            type: "integer",  isArray: true  }, // if chose project track then array length will be 2 
  10: { name: "year_school",      type: "string",   isArray: false }, //bullet option with other ______ 
  11: { name: "lang_prefs",       type: "integer",  isArray: true  },
  12: { name: "interest_skills",  type: "integer",  isArray: true  }, // ??? maybe
  13: { name: "lang_importance",  type: "integer",  isArray: false },
  14: { name: "lang_prefenence",  type: "string",   isArray: false }, // only if 8 or higher on q13
  15: { name: "proj_ideas",       type: "string",   isArray: false }, 
  16: { name: "team_lead",        type: "integer",  isArray: false },
  17: { name: "hours_per_week",   type: "integer",  isArray: false }, // hours/week
  18: { name: "commitment_lev",   type: "integer",  isArray: false },
  19: { name: "commitment_exp",   type: "string",   isArray: false },
  20: { name: "meet_per_week",    type: "string",   isArray: false }, //bullet option with other ______ 
  21: { name: "curr_responsible", type: "string",   isArray: false },
  22: { name: "start_date",       type: "integer",  isArray: true  },
  23: { name: "end_date",         type: "integer",  isArray: true  },
  24: { name: "bring_to_team",    type: "string",   isArray: false },
  25: { name: "professional_link",type: "string",   isArray: false },
  26: { name: "demographics",     type: "string",   isArray: false },
  27: { name: "partner_prefs",    type: "string",   isArray: false },
  28: { name: "commit_agreement", type: "boolean",  isArray: false },
  29: { name: "team_agreement",   type: "string",   isArray: false }, //bullet option with other ______ 
  30: { name: "rules_agreement",  type: "boolean",  isArray: false },
  31: { name: "tips",             type: "string",   isArray: false }
};

// Enables cors support
const cors = require('cors');
app.use(cors());

app.get('/', function (req, res) {
  return res.send('Hello world');
});

app.get('/test', function (req, res) {
  Student.find({}, function (err, students) {
      if (err) return console.error(err);
      res.send(students);
  })
});

app.get('/sheets', function(req, res) {

  // Authorize a client with credentials, then call the Google Sheets API.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), getAllResponses);
  });

  // Get all data, including headers, from sheet
  function getAllResponses(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: '1s_YEDpl9fBMEhYTdMx9xA3CNzsYY1F68mzlCIzX1leU',
      range: 'Form Responses 7!$A$1:$YY',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);

      // allData is all the data in a multidimensional array!
      allData = res.data.values;

      let headers = [];
      let jsoon = {};

      // Read the first row of data and store all headers, will extract question numbers from these later
      for (let i = 0; i < allData[0].length; i++) {
          headers.push(allData[0][i]);
      }

      
      for (let r = 1; r < allData.length; r++) {
          for (let c = 2; c < 5; c++) {
              // Pick appropriate header that corresponds to each column
              // Split header into text and index, then parse index as int
              // This was we can use the index to search through the user_schema!
              let header = headers[c];
              let index = header.split(")")[0];
              index = parseInt(index);

              // Find the correct field name from the user_schema according to question number
              // Populate the "jsoon" that we will be using as a payload to push to Mongo!
              let field = user_schema[index].name;
              jsoon[field] = allData[r][c];
          }

          // This is where the call to Mongo will happen, 
          // right now it is a simple log so you can see how the code works
          console.log(jsoon);
      }

    });
  }
    
})


connectDb().then(async () => {
    app.listen(process.env.PORT, () =>
        console.log(`Example app listening on port ${process.env.PORT}!`),
    );
});


// app.listen(process.env.PORT || 8080);