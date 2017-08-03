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

            this.messenger.sendTextMessage(senderID, 'Mesaj trimis cu success');
            return true;
        } else if (senderID === this.ADMIN_ID && msgLowerCase.indexOf('schimba-iesire:') === 0) {
            var indexOfChange = msgLowerCase.indexOf(':', 16);
            var name = msgLowerCase.substring(15, indexOfChange - 15);
            var value = msgLowerCase.substring(indexOfChange+1);

            var userID = this.db.userNameExists(name);
            if (userID !== null) {
                this.db.users[userID].coming = parseInt(value);
                this.messenger.sendTextMessage(senderID, `[ADMIN]User ${name} schimbat 'coming' in ${value}`);
            } else {
                this.messenger.sendTextMessage(senderID, `[ADMIN]Nu am gasit user-ul '${name}'`);
            }

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
                return true;

            case 'USER_NUVIN':
                this.db.users[senderID].coming = this.answers.NU_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.NU_VIN);
                return true;

            case 'USER_POATEVIN':
                this.db.users[senderID].coming = this.answers.POATE_VIN;
                this.db.changeUserProperty(senderID, 'coming', this.answers.POATE_VIN);
                return true;
        }

        return false;
    }
}
