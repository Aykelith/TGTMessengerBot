export default class ComingOutApp {
    constructor(database, messenger) {
        this.db = database;
        this.messenger = messenger;

        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);
    }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('iesire:') === 0) {
            this.db.users[senderID].coming = true;

            this.db.forEachUser((id) => {
                if (id == senderID) return;

                this.messenger.sendButtonMessage(id, messageText.substring(7), [
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

            this.messenger.sendTextMessage(senderID, 'Mesaj trimis cu success');
            return true;
        } else if (msgLowerCase.indexOf("cine vine") !== -1 || msgLowerCase.indexOf("vine cineva") !== -1) {
            var responseMessage = '';

            var i = 1;
            this.db.forEachUser((id, user) => {
                if (user.coming === true) {
                    responseMessage += i + '.' + user.name + "\n";
                    ++i;
                }
            });
            if (responseMessage === '') responseMessage = "Trist. Nimeni...";
            this.messenger.sendTextMessage(senderID, responseMessage);
            return true;
        }

        return false;
    }

    receivedPostback(senderID, payload) {
        switch (payload) {
            case 'USER_VIN':
                this.db.users[senderID].coming = true;
                return;

            case 'USER_NUVIN':
                this.db.users[senderID].coming = false;
                return;
        }
    }
}
