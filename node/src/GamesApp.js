export default class GamesApp {
    constructor(database, messenger) {
        this.db = database;
        this.messenger = messenger;

        this.inGame = true;
        this.gameHost = null;
        this.gameType = null;

        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);
    }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('jocuri') !== -1) {
            messenger.sendButtonMessage(senderID, "Jocuri disponibile:", [
                {
                    type:    "postback",
                    title:   "Imparatiile",
                    payload: "USER_GAME_IMPARATIILE"
                }
            ]);
        }

        if (this.gameType === 0) {
            console.log(senderID, gameHost);
            if (msgLowerCase.indexOf('cuvant:') === 0) {
                var cuvant = msgLowerCase.substring(7);
                db.users[senderID].cuvant = cuvant;
                messenger.sendTextMessage(senderID, `Cuvantul ales este \'${cuvant}\'`);
            } else if (msgLowerCase.indexOf('cuvinte') !== -1 && senderID === gameHost) {
                var responseMessage = '';
                db.forEachUser((id, user) => {
                    if (user.cuvant) {
                        responseMessage += user.name + ' - ' + user.cuvant + '\n';
                    }
                });
                if (responseMessage === '') responseMessage = "Trist. Nimeni...";
                messenger.sendTextMessage(senderID, responseMessage);
            }
        }
    }

    receivedPostback(senderID, payload) {
        switch (payload) {
            case 'USER_GAME_IMPARATIILE':
                gameType = 0;
                gameHost = senderID;
                break;
        }
    }
}
