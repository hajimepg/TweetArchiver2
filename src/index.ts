#!/usr/bin/env node

import * as url from "url";

import * as Commander from "commander";

import TweetRepository from "./tweetRepository";
import TwitterGateway from "./twitterGateway";

function parseTweetId(urlString): string | null {
    const tweetUrl = url.parse(urlString);
    if (tweetUrl.hostname !== "twitter.com" || tweetUrl.pathname === undefined) {
        return null;
    }

    const regExpResult = /^\/[\w\d]+\/status\/(\d+)$/.exec(tweetUrl.pathname);
    if (regExpResult === null) {
        return null;
    }

    return regExpResult[1];
}

function setUpCommandLineParser(tweetRepository: TweetRepository): any {
    const commandLineParser = Commander
        .version("0.0.1");

    commandLineParser
        .command("add <tweet_url>")
        .action((tweetUrlValue) => {
            const tweetId = parseTweetId(tweetUrlValue);

            if (tweetId === null) {
                commandLineParser.help();
                process.exit(1);
            }

            const twitterGateway = new TwitterGateway({
                access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
                access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
                consumer_key: process.env.TWITTER_CONSUMER_KEY,
                consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            });

            (async () => {
                const tweet = await twitterGateway.getTweet((tweetId as string));

                await tweetRepository.insert(tweet);
            })()
            .catch((error) => {
                console.log(error);
                process.exit(1);
            });
        });

    commandLineParser
        .command("remove <tweet_url>")
        .action((tweetUrlValue) => {
            const tweetId = parseTweetId(tweetUrlValue);

            if (tweetId === null) {
                commandLineParser.help();
                process.exit(1);
            }

            console.log(`remove ${tweetId}`);
        });

    commandLineParser
        .command("output <file_name>")
        .action((fileName) => {
            console.log(`output ${fileName}`);
        });

    return commandLineParser;
}

(async () => {
    const tweetRepository = new TweetRepository();
    await tweetRepository.load();

    const commandLineParser = setUpCommandLineParser(tweetRepository);
    commandLineParser.parse(process.argv);

    const newDocs = await tweetRepository.find({});
    for (const newDoc of newDocs) {
        console.log(newDoc);
    }
})()
.catch((error) => {
    console.log(error);
    process.exit(1);
});
