export default class RechinulGame {
    constructor(hostID, database, messenger) {
        this.db = database;
        this.messenger = messenger;
        this.hostID = hostID;

        this.players = [ hostID ];

        this.receivedMessage = this.receivedMessage.bind(this);
        this.getHostID = this.getHostID.bind(this);
        this.kickPlayer = this.kickPlayer.bind(this);

        this.randomIntFromInterval = this.randomIntFromInterval.bind(this);
    }

    getHostID() { return this.hostID; }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('nu joc') !== -1) {
            for (var i=0; i<this.players.length; ++i) {
                if (this.players[i] == senderID) {
                    this.messenger.sendTextMessage(senderID, 'Ai iesit din joc!');
                    this.players.splice(i, 1);
                    return true;
                }
            }

            this.messenger.sendTextMessage(senderID, 'Nici macar nu erai in joc!');
            return true;
        } else if (msgLowerCase.indexOf('joc') !== -1) {
            this.players.push(senderID);
            this.messenger.sendTextMessage(senderID, 'Ai intrat in joc!');

            return true;
        } else if (msgLowerCase.indexOf('cine joaca') !== -1) {
            var responseMessage = '';
            for (var i=0; i<this.players.length; ++i) {
                responseMessage += (i+1) + '.' + this.db.users[this.players[i]].name + '\n';
            }
            if (responseMessage === '') responseMessage = "Trist. Nimeni...";
            this.messenger.sendTextMessage(senderID, responseMessage);

            return true;
        } else if (senderID == this.hostID) {
            if (msgLowerCase.indexOf('start') !== -1) {
                var rechinulIndex = this.randomIntFromInterval(0, this.players.length);
                this.messenger.sendTextMessage(this.players[rechinulIndex], "TU ESTI RECHINUL!");

                for (var i=0; i<this.players.length; ++i) {
                    if (i === rechinulIndex) continue;
                    this.messenger.sendTextMessage(this.players[i], "Tu NU esti rechinul!");
                }

                return true;
            }
        }

        return false;
    }

    randomIntFromInterval(min,max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    kickPlayer(name) {
        for (var i=0; i<this.players.length; ++i) {
            if (this.db.users[this.players[i]].name == user) {
                var id = this.players[i];
                this.players.splice(i, 1);
                return id;
            }
        }
        return null;
    }
};
