export default class NicoApp {
    constructor(database, messenger) {
        this.db = database;
        this.messenger = messenger;

        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);

        this.isElementInString = this.isElementInString.bind(this);

        this.nicoID = 1295977860525337;
        this.meID =   1256338984475739;

        this.steps = {
            unicorns: {
                many_more: false,
                that_is_all_you_can_do: false
            }
        }

        this.emoticons = {
            unicorn: '🦄',
            hearts: [
                '❤️', '💚', '💛', '💙', '💜'
            ]
        }
    }

    receivedMessage(senderID, messageText) {
        if (senderID != this.nicoID && senderID != this.meID) return false;

        var msgLowerCase = messageText.toLowerCase();

        if (msgLowerCase.indexOf('many more unicorns') !== -1) {
            this.messenger.sendTextMessage(senderID, Array(101).join(this.emoticons.unicorn));
            this.steps.unicorns.many_more = true;
            this.steps.unicorns.that_is_all_you_can_do = false;
            return true;
        } else if (msgLowerCase.indexOf('more unicorns') !== -1) {
            this.messenger.sendTextMessage(senderID, Array(10).join(this.emoticons.unicorn));
            return true;
        } else if (msgLowerCase.indexOf('unicorns') !== -1) {
            this.messenger.sendTextMessage(senderID, Array(4).join(this.emoticons.unicorn));
            return true;
        } else if (msgLowerCase.indexOf('unicorn') !== -1) {
            this.messenger.sendTextMessage(senderID, this.emoticons.unicorn);
            return true;
        } else if (msgLowerCase.indexOf('you can do') !== -1 && this.steps.unicorns.many_more) {
            this.messenger.sendTextMessage(senderID, Array(501).join(this.emoticons.unicorn));
            this.steps.unicorns.many_more = false;
            this.steps.unicorns.that_is_all_you_can_do = true;
            return true;
        } else if (msgLowerCase.indexOf('seriously') !== -1 && this.steps.unicorns.that_is_all_you_can_do) {
            this.messenger.sendTextMessage(senderID, Array(641).join(this.emoticons.unicorn));
            this.messenger.sendTextMessage(senderID, Array(641).join(this.emoticons.unicorn));
            this.messenger.sendTextMessage(senderID, Array(641).join(this.emoticons.unicorn));
            this.messenger.sendTextMessage(senderID, "Can you handle so many unicorns???");
            this.steps.unicorns.that_is_all_you_can_do = false;
            return true;
        } else if (this.isElementInString(msgLowerCase, this.emoticons.hearts)) {
            this.messenger.sendTextMessage(senderID, this.emoticons.hearts.join(''));
            return true;
        }
    }

    receivedPostback(senderID, payload) {
        return false;
    }

    isElementInString(txt, array) {
        for (var i=0; i<array.length; ++i) {
            if (txt.indexOf(array[i]) !== -1) return true;
        }
        return false;
    }
}
