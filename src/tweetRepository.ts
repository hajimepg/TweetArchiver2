import * as DataStore from "nedb";

export default class TweetRepository {
    private db;

    public constructor() {
        this.db = new DataStore({ filename: "tweet.db" });
    }

    public async load(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db.loadDatabase((error) => {
                if (error !== null) {
                    reject(error);
                }

                resolve();
            });
        });
    }

    public async insert(insertDoc: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.db.insert(insertDoc, (error, newDoc) => {
                if (error !== null) {
                    reject(error);
                }

                resolve(newDoc);
            });
        });
    }

    public async find(condition): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.db.find(condition, (error, newDocs) => {
                if (error !== null) {
                    reject(error);
                }

                resolve(newDocs);
            });
        });
    }
}