export default class ImparatiileGame {
    constructor(hostID, database, messenger) {
        this.db = database;
        this.messenger = messenger;
        this.hostID = hostID;
        this.hostWords = [];

        this.players = {};

        this.receivedMessage = this.receivedMessage.bind(this);
        this.getHostID = this.getHostID.bind(this);

        this.kickPlayer = this.kickPlayer.bind(this);
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
        } else if (msgLowerCase.indexOf('cuvant:') === 0) {
            var cuvant = msgLowerCase.substring(7);

            if (senderID == this.hostID) {
                this.hostWords.push(cuvant);
                this.messenger.sendTextMessage(senderID, `Cuvantul ales este ${cuvant}. Ai pus ` + this.hostWords.length + ' cuvinte extra');
            } else {
                this.players[senderID] = cuvant;
                this.messenger.sendTextMessage(senderID, `Cuvantul ales este ${cuvant}`);
            }

            return true;
        } else if (senderID == this.hostID) {
            if (msgLowerCase.indexOf('cuvinte') !== -1) {
                var responseMessage = '';
                for (var playerID in this.players) {
                    responseMessage += this.db.users[playerID].name + ': ' + this.players[playerID] + '\n';
                }
                for (var i=0; i<this.hostWords.length; ++i) {
                    responseMessage += 'AL TAU:' + this.hostWords[i] + '\n';
                }
                if (responseMessage === '') responseMessage = "Trist. Nimeni...";

                this.messenger.sendTextMessage(senderID, responseMessage);
                return true;
            } else if (msgLowerCase.indexOf('reset') !== -1) {
                this.players = {};
                this.hostWords = [];
                this.messenger.sendTextMessage(senderID, `Jocul a fost resetat`);
            }
        }

        return false;
    }

    kickPlayer(name) {

    }
};
