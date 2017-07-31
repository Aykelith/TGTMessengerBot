import GamesTypes from 'GamesTypes';
import RechinulGame from 'RechinulGame';

export default class GamesApp {
    constructor(database, messenger) {
        this.db = database;
        this.messenger = messenger;

        this.game = null;

        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);
    }

    receivedMessage(senderID, messageText) {
        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('jocuri') !== -1) {
            this.messenger.sendButtonMessage(senderID, "Jocuri disponibile:", [
                {
                    type:    "postback",
                    title:   "Rechinul",
                    payload: GamesTypes.RECHINUL.payload
                }
            ]);
            return true;
        } else if (this.game !== null && this.game.getHostID() == senderID && msgLowerCase.indexOf('gata jocul') !== -1) {
            this.game = null;
            this.messenger.sendTextMessage(senderID, 'Jocul s-a terminat');
        }

        if (this.game !== null) return this.game.receivedMessage(senderID, messageText);
        else                    return false;
    }

    receivedPostback(senderID, payload) {
        switch (payload) {
            case GamesTypes.RECHINUL.payload:
                this.game = new RechinulGame(senderID, this.db, this.messenger);
                this.messenger.sendTextMessage(senderID, "Jocul este \'Rechinul\'");
                return true;
        }

        return false;
    }
}
