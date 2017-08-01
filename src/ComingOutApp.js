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
    }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('iesire:') === 0) {
            this.db.users[senderID].coming = this.answers.VIN;

            this.db.forEachUser((id) => {
                if (id == senderID) return;

                this.messenger.sendButtonMessage(id, '(' + this.db.users[senderID].name + ') ' + messageText.substring(7), [
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
        } else {
            var cineIndex = msgLowerCase.indexOf("cine");
            var vineIndex = msgLowerCase.indexOf("vine");

            if (cineIndex == -1 && vineIndex == -1) return false;

            var nuIndex = msgLowerCase.indexOf("nu");
            var poateIndex = msgLowerCase.indexOf("poate");

            var option = (nuIndex == -1 && poateIndex == -1) ? this.answers.VIN : ( (nuIndex == -1) ? this.answers.POATE_VIN : this.answers.NU_VIN );

            var responseMessage = '';

            var i = 1;
            this.db.forEachUser((id, user) => {
                if (user.coming === option) {
                    responseMessage += i + '.' + user.name + "\n";
                    ++i;
                }
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
                return true;

            case 'USER_NUVIN':
                this.db.users[senderID].coming = this.answers.NU_VIN;
                return true;

            case 'USER_POATEVIN':
                this.db.users[senderID].coming = this.answers.POATE_VIN;
                return true;
        }

        return false;
    }
}
