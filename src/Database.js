import mongodb from 'mongodb';
import monk from 'monk';

export default class Database {
    constructor() {
        const self = this;

        var db_url = 'mongodb://localhost:27017/tgt';
        this.db = monk(db_url);
        this.db_users = this.db.get('users');

        this.users_ids = [];
        this.users = {};

        this.db_users.find({}).then((docs) => {
            for (var i=0; i<docs.length; ++i) {
                self.users_ids.push(parseInt(docs[i].id));
                self.users[docs[i].id] = {
                    name: docs[i].name
                }
            }

            console.log('[Database][constructor]Initial list:', this.users, this.users_ids);
        }).catch((err) => {
            console.error(err);
        });

        this.userExists = this.userExists.bind(this);
        this.insertUser = this.insertUser.bind(this);
        this.changeUserName = this.changeUserName.bind(this);
        this.forEachUser = this.forEachUser.bind(this);
        this.insertTemporaryUser = this.insertTemporaryUser.bind(this);
    }

    userExists(id) {
        console.log("[Database][userExists]id:", id, "allArray:", this.users_ids);
        for (var i=0; i<this.users_ids.length; ++i) {
            console.log(this.users_ids[i],id,(this.users_ids[i] == id));
            if (this.users_ids[i] == id) return true;
        }
        console.log('\tFALSE');
        return false;
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

    forEachUser(func) {
        for (var i=0; i<this.users_ids.length; ++i) {
            var id = this.users_ids[i];
            func(id, this.users[id]);
        }
    }
}