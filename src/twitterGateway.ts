import * as assert from "assert";

import * as Twitter from "twitter";

import Tweet from "./twitterObjects/tweet";

interface ITwitterCredential {
    access_token_key: string | undefined;
    access_token_secret: string | undefined;
    consumer_key: string | undefined;
    consumer_secret: string | undefined;
}

export default class TwitterGateway {
    protected client;

    constructor(credential: ITwitterCredential) {
        this.client = new Twitter(credential);
    }

    public async getTweet(idStr: string): Promise<Tweet> {
        return new Promise<Tweet>((resolve, reject) => {
            this.client.get("statuses/show", { id: idStr }, (error, response: Tweet) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(response);
            });
        });
    }
}
