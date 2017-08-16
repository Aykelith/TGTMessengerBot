import mongodb from 'mongodb';
import monk from 'monk';

export default class Database {
    constructor() {
        const self = this;

        var db_url = 'mongodb://alex:1997526alex@ds129593.mlab.com:29593/heroku_rb27j21z'; //'mongodb://localhost:27017/tgt';
        this.db = monk(db_url);
        this.db_users = this.db.get('users');
        this.db_commands = this.db.get('commands');

        this.users_ids = [];
        this.users = {};

        this.db_users.find({}).then((docs) => {
            for (var i=0; i<docs.length; ++i) {
                self.users_ids.push(parseInt(docs[i].id));
                self.users[docs[i].id] = docs[i];
            }

            console.log('[Database][constructor]Initial list:', this.users);
        }).catch((err) => {
            console.error(err);
        });

        this.userExists = this.userExists.bind(this);
        this.userNameExists = this.userNameExists.bind(this);
        this.insertUser = this.insertUser.bind(this);
        this.changeUserName = this.changeUserName.bind(this);
        this.forEachUser = this.forEachUser.bind(this);
        this.insertTemporaryUser = this.insertTemporaryUser.bind(this);

        this.changeUserProperty = this.changeUserProperty.bind(this);
        this.changeAllUsersProperties = this.changeAllUsersProperties.bind(this);
    }

    userExists(id) {
        for (var i=0; i<this.users_ids.length; ++i) {
            console.log(this.users_ids[i],id,(this.users_ids[i] == id));
            if (this.users_ids[i] == id) return true;
        }
        return false;
    }

    userNameExists(name) {
        for (var userID in this.users) {
            if (this.users[userID] === name) return user;
        }
        return null;
    }

    insertUser(id, name) {
        this.db_users.insert({ id: parseInt(id), name: name });
        this.users_ids.push(id);
        this.users[id] = {};
        this.users[id].name = name;
    }

    insertTemporaryUser(id) {
        this.users[id] = {};
        this.users[id].tmp = true;
    }

    changeUserName(id, newName) {
        this.db_users.update({ id: id }, { $set: { name: newName } });
        this.users[id].name = newName;
    }

    changeUserProperty(id, property, value) {
        var updateObject = { $set: {} };
        updateObject.$set[property] = value;
        this.db_users.update({ id: id }, updateObject).then((e) => { console.log(e); }).catch((err) => { console.error(err); });
    }

    changeAllUsersProperties(property, value) {
        var updateObject = { $set: {} };
        updateObject.$set[property] = value;
        this.db_users.update({ }, updateObject, { multi: true }).catch((err) => { console.error(err); });
    }

    forEachUser(func) {
        for (var i=0; i<this.users_ids.length; ++i) {
            var id = this.users_ids[i];
            func(id, this.users[id]);
        }
    }

    getCommand(commad) {
        this.db_commands.findOne({ command:command }, 'text').then((doc) => {
            if (doc === null) return null;
            else return doc.text;
        }).catch((err) => {
            console.error(err);
        });
    }
}
