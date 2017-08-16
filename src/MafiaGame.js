export default class MafiaGame {
    constructor(hostID, database, messenger) {
        this.db = database;
        this.messenger = messenger;
        this.hostID = hostID;

        this.players = [ hostID ];
        this.setup = {};
        this.roles = [];
        this.total = 0;

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
            this.messenger.sendTextMessage(this.hostID, `${this.db.users[senderID].name} a intrat in joc`);

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
                var playersCopy = this.players.slice();
                var setup = Object.assign({}, this.setup);
                var finalSetup = {};

                for (var i=0; i<this.roles.length - 1; ++i) {
                    finalSetup[this.roles[i]] = [];
                }

                for (var i=0; i<playersCopy.length - 1; ++i) {
                    var index = this.randomIntFromInterval(0, playersCopy.length - 1);
                    var player = playersCopy[index];
                    playersCopy.splice(index, 1);

                    var role;
                    for (var j=0; j<this.roles.length - 1; ++i) {
                        role = this.roles[j];
                        if (setup[role] != 0) {
                            --setup[role];
                            break;
                        }
                    }

                    finalSetup[role].push(player);

                    this.messenger.sendTextMessage(player, `Tu esti ${role}`);
                }

                var hostMessage = '';
                for (var i=0; i<this.roles.length - 1; ++i) {
                    hostMessage += this.roles[i] + ': ';
                    for (var j=0; j<finalSetup[this.roles[i]].length-1; ++j) {
                        hostMessage += this.db.users[finalSetup[this.roles[i]][j]].name + ' ';
                    }
                    hostMessage + '\n';
                }

                this.messenger.sendTextMessage(this.hostID, hostMessage);

                return true;
            } else if (msgLowerCase.indexOf('rol:') === 0) {
                var role = msgLowerCase.substring(4, msgLowerCase.indexOf(' ', 5));
                var value = parseInt(msgLowerCase.substring(msgLowerCase.indexOf(' ', 5) + 1));
                this.roles.push(role);
                this.setup[role] = value;
                this.total += value;

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
