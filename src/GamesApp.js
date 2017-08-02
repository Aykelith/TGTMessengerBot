import GamesTypes from 'GamesTypes';
import RechinulGame from 'RechinulGame';
import ImparatiileGame from 'ImparatiileGame';

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
                },
                {
                    type:    "postback",
                    title:   "Imparatiile",
                    payload: GamesTypes.IMPARATIILE.payload
                }
            ]);
            return true;
        } else if (this.game !== null && this.game.getHostID() == senderID) {
            if (msgLowerCase.indexOf('gata jocul') !== -1) {
                this.game = null;
                this.messenger.sendTextMessage(senderID, 'Jocul s-a terminat');
                return true;
            } else if (msgLowerCase.indexOf('iesire:') === 0 || msgLowerCase.indexOf('iesire :') === 0) {
                var user = msgLowerCase.substring(7);

                var kickedPlayerID = this.game.kickPlayer(user);
                if (kickedPlayerID !== null) {
                    this.messenger.sendTextMessage(senderID, `${user} a iesit din joc`);
                    this.messenger.sendTextMessage(kickedPlayerID, "Ai fost dat afara din joc! Rusine sa-ti fie!!");
                } else {
                    this.messenger.sendTextMessage(senderID, `'${user}' nu exista!`);
                }

                return true;
            }
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

            case GamesTypes.IMPARATIILE.payload:
                this.game = new ImparatiileGame(senderID, this.db, this.messenger);
                this.messenger.sendTextMessage(senderID, "Jocul este \'Imparatiile\'");
                return true;
        }

        return false;
    }
}
