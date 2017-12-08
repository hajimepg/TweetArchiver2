#!/usr/bin/env node

import * as url from "url";

import * as Commander from "commander";

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

        console.log(`add ${tweetId}`);
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

commandLineParser.parse(process.argv);
