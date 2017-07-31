/*
* Copyright 2016-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*
*/

/* jshint node: true, devel: true */
'use strict';

import MessengerAPI from 'MessengerAPI';
import Database from 'Database';
import ComingOutApp from 'ComingOutApp';

import express from 'express';

import path from 'path';

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/privacy', (req, res) => {
    console.log("AAAA");
    return res.render('index');
});

const ADMIN_ID = '1256338984475739';

var messenger    = new MessengerAPI(app);
var db           = new Database();
var comingOutApp = new ComingOutApp(db, messenger);

messenger.setReceivedMessageHandler((event) => {
    var senderID = event.sender.id;

    var message = event.message;
    var messageText = message.text;

    if (messageText) {
        if (!db.userExists(senderID)) {
            db.insertUser(senderID, messageText);
            messenger.sendTextMessage(senderID, `Bine ai venit, ${messageText}!`);
            return;
        }

        if (comingOutApp.receivedMessage(senderID, messageText)) return;

        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('nume:') === 0) {
            var name = messageText.substring(5);
            db.changeUserName(senderID, name);
            messenger.sendTextMessage(senderID, `Noul tau nume este \'${name}\'`);
            return;
        }
    }
});

messenger.setReceivedPostbackHandler((event) => {
    var senderID = event.sender.id;
    var payload = event.postback.payload;

    comingOutApp.receivedPostback(senderID, payload);
});

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
