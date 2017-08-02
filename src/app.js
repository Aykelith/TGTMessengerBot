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
import GamesApp from 'GamesApp';
import NicoApp from 'NicoApp';

import express from 'express';
import https from 'https';
import fs from 'fs';

var request = require('request');

import path from 'path';

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_ID = '1256338984475739';

var messenger    = new MessengerAPI(app);
var db           = new Database();
var comingOutApp = new ComingOutApp(db, messenger);
var gamesApp     = new GamesApp(db, messenger);
var nicoApp      = new NicoApp(db, messenger);

const EDI_QUOTES = [
    'IN IAD CU TINE!',
    'LA CAZAN CU TINE!',
    'VEZI CA TE DUCI IN IAD!'
]

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

messenger.setReceivedMessageHandler((event) => {
    var senderID = event.sender.id;

    var message = event.message;
    var messageText = message.text;

    if (messageText) {
        if (!db.userExists(senderID)) {
            if (!db.users[senderID]) {
                messenger.sendTextMessage(senderID, "Bine ai venit!\nCum te cheama(prenumele)?");
                db.insertTemporaryUser(senderID);
                return;
            } else {
                db.insertUser(senderID, messageText);
                messenger.sendTextMessage(senderID, `Bine ai venit, ${messageText}!`);
                return;
            }
        }

        if (comingOutApp.receivedMessage(senderID, messageText)) return;
        if (gamesApp.receivedMessage(senderID, messageText)) return;
		if (nicoApp.receivedMessage(senderID, messageText)) return;

        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('nume:') === 0 || msgLowerCase.indexOf('nume :') === 0) {
            var name = messageText.substring(5);
            db.changeUserName(senderID, name);
            messenger.sendTextMessage(senderID, `Noul tau nume este \'${name}\'`);
            return;
        } else if (msgLowerCase.indexOf('caine') !== -1) {
            request('http://thedogapi.co.uk/api/v1/dog', function (error, response, body) {
                if (response.statusCode != 200) {
                    messenger.sendTextMessage(senderID, "Ma simt cam prost momentan...");
                    return;
                }

                var url = JSON.parse(body).data[0].url;
                messenger.sendImageMessage(senderID, url);
            });
        } else if (msgLowerCase.indexOf('edi') === 0) {
            messenger.sendTextMessage(senderID, EDI_QUOTES[randomIntFromInterval(0, EDI_QUOTES.length-1)]);
        } else if (msgLowerCase.indexOf('robu') === 0) {
            messenger.sendTextMessage(senderID, 'Numele aleatoriu selectat este: ' + db.users[db.users_ids[randomIntFromInterval(0, db.users_ids.length-1)]].name);
        } else if (msgLowerCase.indexOf('alex') === 0) {
            messenger.sendTextMessage(senderID, randomIntFromInterval(0, 1) ? 'TITIREZ!' : 'Tiramisu');
        } else if (msgLowerCase.indexOf('beky') === 0 || msgLowerCase.indexOf('becky') === 0) {
            messenger.sendTextMessage(senderID, randomIntFromInterval(0, 1) ? 'Grupul s-o racit!' : 'M-am indepartat...');
        } else if (msgLowerCase.indexOf('estera') === 0) {
            messenger.sendTextMessage(senderID, 'M-am suparat...');
        } else if (msgLowerCase.indexOf('simina') === 0) {
            messenger.sendTextMessage(senderID, 'O sa fac o poveste');
        } else if (msgLowerCase.indexOf('ionela') === 0) {
            messenger.sendTextMessage(senderID, 'Eu nu ma joc!');
        } else if (msgLowerCase.indexOf('manu') === 0) {
            messenger.sendTextMessage(senderID, ' ');
        } else if (msgLowerCase.indexOf('help') === 0) {
            messenger.sendTextMessage(senderID, `Lista de cuvinte:
nume:[NUME NOU] - iti schimbi numele
iesire:[]...
edi
robu
alex
beky
estera
simina
ionela
manu`);
        } else {
            messenger.sendTextMessage(senderID, 'Nu inteleg ce vrei sa spui...');
        }
    }
});

messenger.setReceivedPostbackHandler((event) => {
    var senderID = event.sender.id;
    var payload = event.postback.payload;

    if (comingOutApp.receivedPostback(senderID, payload)) return;
    if (gamesApp.receivedPostback(senderID, payload)) return;
});

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
