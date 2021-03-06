const
bodyParser = require('body-parser'),
crypto = require('crypto'),
express = require('express'),
https = require('https'),
request = require('request');

export default class MessengerAPI {
    constructor(app) {
        const self = this;
        this.receivedMessageHandler = null;
        this.receivedPostbackHandler = null;

        this.setReceivedMessageHandler = this.setReceivedMessageHandler.bind(this);
        this.setReceivedPostbackHandler = this.setReceivedPostbackHandler.bind(this);

        this.verifyRequestSignature = this.verifyRequestSignature.bind(this);
        this.receivedAuthentication = this.receivedAuthentication.bind(this);
        this.receivedMessage = this.receivedMessage.bind(this);
        this.receivedDeliveryConfirmation = this.receivedDeliveryConfirmation.bind(this);
        this.receivedPostback = this.receivedPostback.bind(this);
        this.receivedMessageRead = this.receivedMessageRead.bind(this);
        this.receivedAccountLink = this.receivedAccountLink.bind(this);
        this.sendImageMessage = this.sendImageMessage.bind(this);
        this.sendGifMessage = this.sendGifMessage.bind(this);
        this.sendAudioMessage = this.sendAudioMessage.bind(this);
        this.sendVideoMessage = this.sendVideoMessage.bind(this);
        this.sendFileMessage = this.sendFileMessage.bind(this);
        this.sendTextMessage = this.sendTextMessage.bind(this);
        this.sendButtonMessage = this.sendButtonMessage.bind(this);
        this.sendGenericMessage = this.sendGenericMessage.bind(this);
        this.sendReceiptMessage = this.sendReceiptMessage.bind(this);
        this.sendQuickReply = this.sendQuickReply.bind(this);
        this.sendReadReceipt = this.sendReadReceipt.bind(this);
        this.sendTypingOn = this.sendTypingOn.bind(this);
        this.sendTypingOff = this.sendTypingOff.bind(this);
        this.sendAccountLinking = this.sendAccountLinking.bind(this);
        this.callSendAPI = this.callSendAPI.bind(this);

        // App Secret can be retrieved from the App Dashboard
        this.APP_SECRET = '4f6dce66f462ea1d000afb86d3eab055';

        // Arbitrary value used to validate a webhook
        this.VALIDATION_TOKEN = 'TGT_TOKEN';

        // Generate a page access token for your page from the App Dashboard
        this.PAGE_ACCESS_TOKEN = 'EAAG3ZCJaKAxoBAKHbXFlPXX4jUKvWc3LuwsmW6LEhZAYG2tcIDXqgB3OKoxHzJBZBnfwsMlXih0g9CpWTIZBx7BpQvMmTvPuLAaem4yatPrhavJZBXZA92m8emrefBTKavcqnildhLTjzmVi33bO2ZAVhk0VLVKGNOG8qZAWu6VvvwZDZD';

        // URL where the app is running (include protocol). Used to point to scripts and
        // assets located at this address.
        this.SERVER_URL = 'https://2fec90f6.ngrok.io';
        app.use(bodyParser.json({ verify: this.verifyRequestSignature }));

        /*
        * Use your own validation token. Check that the token used in the Webhook
        * setup is the same token used here.
        *
        */
        app.get('/webhook', function(req, res) {
            if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === self.VALIDATION_TOKEN) {
                console.log("Validating webhook");
                res.status(200).send(req.query['hub.challenge']);
            } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
            }
        });


        /*
        * All callbacks for Messenger are POST-ed. They will be sent to the same
        * webhook. Be sure to subscribe your app to your page to receive callbacks
        * for your page.
        * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
        *
        */
        app.post('/webhook', function (req, res) {
            var data = req.body;

            // Make sure this is a page subscription
            if (data.object == 'page') {
                // Iterate over each entry
                // There may be multiple if batched
                data.entry.forEach(function(pageEntry) {
                    var pageID = pageEntry.id;
                    var timeOfEvent = pageEntry.time;

                    // Iterate over each messaging event
                    pageEntry.messaging.forEach(function(messagingEvent) {
                        if (messagingEvent.optin) {
                            self.receivedAuthentication(messagingEvent);
                        } else if (messagingEvent.message) {
                            self.receivedMessage(messagingEvent);
                        } else if (messagingEvent.delivery) {
                            self.receivedDeliveryConfirmation(messagingEvent);
                        } else if (messagingEvent.postback) {
                            self.receivedPostback(messagingEvent);
                        } else if (messagingEvent.read) {
                            self.receivedMessageRead(messagingEvent);
                        } else if (messagingEvent.account_linking) {
                            self.receivedAccountLink(messagingEvent);
                        } else {
                            console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                        }
                    });
                });

                // Assume all went well.
                //
                // You must send back a 200, within 20 seconds, to let us know you've
                // successfully received the callback. Otherwise, the request will time out.
                res.sendStatus(200);
            }
        });

        /*
        * This path is used for account linking. The account linking call-to-action
        * (sendAccountLinking) is pointed to this URL.
        *
        */
        app.get('/authorize', function(req, res) {
            var accountLinkingToken = req.query.account_linking_token;
            var redirectURI = req.query.redirect_uri;

            // Authorization Code should be generated per user by the developer. This will
            // be passed to the Account Linking callback.
            var authCode = "1234567890";

            // Redirect users to this URI on successful login
            var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

            res.render('authorize', {
                accountLinkingToken: accountLinkingToken,
                redirectURI: redirectURI,
                redirectURISuccess: redirectURISuccess
            });
        });
    }

    /*
    * Verify that the callback came from Facebook. Using the App Secret from
    * the App Dashboard, we can verify the signature that is sent with each
    * callback in the x-hub-signature field, located in the header.
    *
    * https://developers.facebook.com/docs/graph-api/webhooks#setup
    *
    */
    verifyRequestSignature(req, res, buf) {
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac('sha1', this.APP_SECRET)
            .update(buf)
            .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    /*
    * Authorization Event
    *
    * The value for 'optin.ref' is defined in the entry point. For the "Send to
    * Messenger" plugin, it is the 'data-ref' field. Read more at
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
    *
    */
    receivedAuthentication(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        var passThroughParam = event.optin.ref;

        console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage(senderID, "Authentication successful");
    }

    /*
    * Message Event
    *
    * This event is called when a message is sent to your page. The 'message'
    * object format can vary depending on the kind of message that was received.
    * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
    *
    * For this example, we're going to echo any text that we get. If we get some
    * special keywords ('button', 'generic', 'receipt'), then we'll send back
    * examples of those bubbles to illustrate the special message bubbles we've
    * created. If we receive a message with an attachment (image, video, audio),
    * then we'll simply confirm that we've received the attachment.
    *
    */
    receivedMessage(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;

        console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
        console.log(JSON.stringify(message));

        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var quickReply = message.quick_reply;

        if (isEcho) {
            // Just logging message echoes to console
            console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
            return;
        }

        this.receivedMessageHandler(event);
    }


    /*
    * Delivery Confirmation Event
    *
    * This event is sent to confirm the delivery of a message. Read more about
    * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
    *
    */
    receivedDeliveryConfirmation(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;

        if (messageIDs) {
            messageIDs.forEach(function(messageID) {
                console.log("Received delivery confirmation for message ID: %s",
                messageID);
            });
        }

        console.log("All message before %d were delivered.", watermark);
    }


    /*
    * Postback Event
    *
    * This event is called when a postback is tapped on a Structured Message.
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
    *
    */
    receivedPostback(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        var payload = event.postback.payload;

        console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

        // When a postback is called, we'll send a message back to the sender to
        // let them know it was successful

        this.receivedPostbackHandler(event);
    }

    /*
    * Message Read Event
    *
    * This event is called when a previously-sent message has been read.
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
    *
    */
    receivedMessageRead(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;

        console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
    }

    /*
    * Account Link Event
    *
    * This event is called when the Link Account or UnLink Account action has been
    * tapped.
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
    *
    */
    receivedAccountLink(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        var status = event.account_linking.status;
        var authCode = event.account_linking.authorization_code;

        console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
    }

    /*
    * Send an image using the Send API.
    *
    */
    sendImageMessage(recipientId, url) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: url
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a Gif using the Send API.
    *
    */
    sendGifMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: this.SERVER_URL + "/assets/instagram_logo.gif"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send audio using the Send API.
    *
    */
    sendAudioMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: this.SERVER_URL + "/assets/sample.mp3"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a video using the Send API.
    *
    */
    sendVideoMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: this.SERVER_URL + "/assets/allofus480.mov"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a file using the Send API.
    *
    */
    sendFileMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: this.SERVER_URL + "/assets/test.txt"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a text message using the Send API.
    *
    */
    sendTextMessage(recipientId, messageText) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "SERVER_MESSAGE"
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a button message using the Send API.
    *
    */
    sendButtonMessage(recipientId, message, buttons) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: message,
                        buttons: buttons
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a Structured Message (Generic Message type) using the Send API.
    *
    */
    sendGenericMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "rift",
                            subtitle: "Next-generation virtual reality",
                            item_url: "https://www.oculus.com/en-us/rift/",
                            image_url: this.SERVER_URL + "/assets/rift.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/rift/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for first bubble",
                            }],
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: this.SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/touch/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for second bubble",
                            }]
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a receipt message using the Send API.
    *
    */
    sendReceiptMessage(recipientId) {
        // Generate a random receipt ID as the API requires a unique ID
        var receiptId = "order" + Math.floor(Math.random()*1000);

        var messageData = {
            recipient: {
                id: recipientId
            },
            message:{
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "receipt",
                        recipient_name: "Peter Chang",
                        order_number: receiptId,
                        currency: "USD",
                        payment_method: "Visa 1234",
                        timestamp: "1428444852",
                        elements: [{
                            title: "Oculus Rift",
                            subtitle: "Includes: headset, sensor, remote",
                            quantity: 1,
                            price: 599.00,
                            currency: "USD",
                            image_url: this.SERVER_URL + "/assets/riftsq.png"
                        }, {
                            title: "Samsung Gear VR",
                            subtitle: "Frost White",
                            quantity: 1,
                            price: 99.99,
                            currency: "USD",
                            image_url: this.SERVER_URL + "/assets/gearvrsq.png"
                        }],
                        address: {
                            street_1: "1 Hacker Way",
                            street_2: "",
                            city: "Menlo Park",
                            postal_code: "94025",
                            state: "CA",
                            country: "US"
                        },
                        summary: {
                            subtotal: 698.99,
                            shipping_cost: 20.00,
                            total_tax: 57.67,
                            total_cost: 626.66
                        },
                        adjustments: [{
                            name: "New Customer Discount",
                            amount: -50
                        }, {
                            name: "$100 Off Coupon",
                            amount: -100
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a message with Quick Reply buttons.
    *
    */
    sendQuickReply(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: "What's your favorite movie genre?",
                quick_replies: [
                    {
                        "content_type":"text",
                        "title":"Action",
                        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
                    },
                    {
                        "content_type":"text",
                        "title":"Comedy",
                        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
                    },
                    {
                        "content_type":"text",
                        "title":"Drama",
                        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
                    }
                ]
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a read receipt to indicate the message has been read
    *
    */
    sendReadReceipt(recipientId) {
        console.log("Sending a read receipt to mark message as seen");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        this.callSendAPI(messageData);
    }

    /*
    * Turn typing indicator on
    *
    */
    sendTypingOn(recipientId) {
        console.log("Turning typing indicator on");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        this.callSendAPI(messageData);
    }

    /*
    * Turn typing indicator off
    *
    */
    sendTypingOff(recipientId) {
        console.log("Turning typing indicator off");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        this.callSendAPI(messageData);
    }

    /*
    * Send a message with the account linking call-to-action
    *
    */
    sendAccountLinking(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Welcome. Link your account.",
                        buttons:[{
                            type: "account_link",
                            url: this.SERVER_URL + "/authorize"
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
    * Call the Send API. The message data goes in the body. If successful, we'll
    * get the message id in a response
    *
    */
    callSendAPI(messageData) {
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: this.PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                    recipientId);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    }

    setReceivedMessageHandler(handler) {
        this.receivedMessageHandler = handler;
    }

    setReceivedPostbackHandler(handler) {
        this.receivedPostbackHandler = handler;
    }
}
