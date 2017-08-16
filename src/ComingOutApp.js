export default class ComingOutApp {
    constructor(database, messenger) {
        this.db = database;
        this.messenger = messenger;

        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);

        this.answers = {
            VIN: 0,
            NU_VIN: 1,
            POATE_VIN: 2
        }

        this.hostID = null;

        this.ADMIN_ID = 1256338984475739;
    }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('iesire:') === 0 || msgLowerCase.indexOf('iesire :') === 0) {
            this.db.users[senderID].coming = this.answers.VIN;

            var startingString = (msgLowerCase.indexOf('iesire :') === 0) ? 8 : 7;

            this.db.forEachUser((id) => {
                if (id == senderID) return;

                this.messenger.sendButtonMessage(id, '(' + this.db.users[senderID].name + ') ' + messageText.substring(startingString), [
                    {
                        type:    "postback",
                        title:   "Vin",
                        payload: "USER_VIN"
                    },
                    {
                        type:    "postback",
                        title:   "Nu vin",
                        payload: "USER_NUVIN"
                    },
                    {
                        type:    "postback",
                        title:   "Poate vin",
                        payload: "USER_POATEVIN"
                    }
                ]);
                this.db.users[id].coming = null;
            });

            this.db.changeAllUsersProperties('coming', null);

            this.hostID = senderID;

            this.messenger.sendTextMessage(senderID, 'Mesaj trimis cu success');
            return true;
        } else if (senderID == this.ADMIN_ID && msgLowerCase.indexOf('schimba-iesire:') === 0) {
            var indexOfChange = msgLowerCase.indexOf(':', 16);
            var name = messageText.substring(15, indexOfChange - 15);
            var value = msgLowerCase.substring(indexOfChange+1);

            var userID = this.db.userNameExists(name);
            if (userID !== null) {
                this.db.users[userID].coming = parseInt(value);
                this.messenger.sendTextMessage(senderID, `[ADMIN]User ${name} schimbat 'coming' in ${value}`);
            } else {
                this.messenger.sendTextMessage(senderID, `[ADMIN]Nu am gasit user-ul '${name}'`);
            }

            return true;
        } else if (msgLowerCase.indexOf(' vin ') !== -1 || msgLowerCase.indexOf(' vin') !== -1 || msgLowerCase.indexOf('vin ') !== -1 || msgLowerCase == 'vin') {
            var response;
            if (msgLowerCase.indexOf('nu') !== -1) {
                this.db.users[senderID].coming = this.answers.NU_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.NU_VIN);
                response = 'nu vine';
            } else if (msgLowerCase.indexOf('poate') !== -1) {
                this.db.users[senderID].coming = this.answers.POATE_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.POATE_VIN);
                response = 'poate vine';
            } else {
                this.db.users[senderID].coming = this.answers.VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.VIN);
                response = 'vine';
            }

            this.messenger.sendTextMessage(this.hostID, `${this.db.users[senderID].name} ${response}`);
            this.messenger.sendTextMessage(senderID, 'Te-am notat!');
            return true;
        } else {
            var cineIndex = msgLowerCase.indexOf("cine");
            var vineIndex = msgLowerCase.indexOf("vine");

            if (cineIndex == -1 && vineIndex == -1) return false;

            var responseMessage = '';

            var i = 1;
            this.db.forEachUser((id, user) => {
                if (user.coming !== this.answers.VIN && user.coming !== this.answers.NU_VIN && user.coming != this.answers.POATE_VIN) return;
                var option = (user.coming === this.answers.VIN) ? 'VINE' : ((user.coming === this.answers.NU_VIN) ? 'NU VINE' : 'POATE VINE');
                responseMessage += `${i}.${user.name} - ${option}\n`;
                ++i;
            });
            if (responseMessage === '') responseMessage = "Trist. Nimeni...";
            this.messenger.sendTextMessage(senderID, responseMessage);
            return true;
        }
    }

    receivedPostback(senderID, payload) {
        switch (payload) {
            case 'USER_VIN':
                this.db.users[senderID].coming = this.answers.VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.VIN);
                this.messenger.sendTextMessage(senderID, 'Te-am notat!');
                this.messenger.sendTextMessage(this.hostID, `${this.db.users[senderID].name} vine`);
                return true;

            case 'USER_NUVIN':
                this.db.users[senderID].coming = this.answers.NU_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.NU_VIN);
                this.messenger.sendTextMessage(senderID, 'Te-am notat!');
                this.messenger.sendTextMessage(this.hostID, `${this.db.users[senderID].name} nu vine`);
                return true;

            case 'USER_POATEVIN':
                this.db.users[senderID].coming = this.answers.POATE_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.POATE_VIN);
                this.messenger.sendTextMessage(senderID, 'Te-am notat!');
                this.messenger.sendTextMessage(this.hostID, `${this.db.users[senderID].name} poate vine`);
                return true;
        }

        return false;
    }
}
