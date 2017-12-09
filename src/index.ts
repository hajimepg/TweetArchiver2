#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import * as Commander from "commander";
import * as Nunjucks from "nunjucks";
import * as TwitterText from "twitter-text";

import { downloadMedia, downloadProfileImage } from "./downloadImage";
import * as FileSystemUtil from "./fileSystemUtil";
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

                const iconDirName = "./db/icons/";
                if (fs.existsSync(iconDirName) === false) {
                    fs.mkdirSync(iconDirName);
                }

                const iconBaseFileName = tweet.user.screen_name;

                let iconFileName: string | null = null;
                for (const iconExtension of ["jpg", "png"]) {
                    const iconFullPath = path.join(iconDirName, `${iconBaseFileName}.${iconExtension}`);

                    if (fs.existsSync(iconFullPath)) {
                        iconFileName = `${iconBaseFileName}.${iconExtension}`;
                    }
                }

                if (iconFileName === null) {
                    iconFileName = await downloadProfileImage(tweet.user.profile_image_url,
                        iconDirName, iconBaseFileName);
                }

                /* tslint:disable:object-literal-sort-keys */
                const newDoc = {
                    originalTweet : tweet,
                    iconFileName,
                };
                /* tslint:enable:object-literal-sort-keys */

                await tweetRepository.insert(newDoc);
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

            (async () => {
                await tweetRepository.remove({ id_str: tweetId });
            })()
            .catch((error) => {
                console.log(error);
                process.exit(1);
            });
        });

    commandLineParser
        .command("output")
        .action((fileName) => {
            (async () => {
                const tweets = await tweetRepository.find({});

                if (tweets.length === 0)  {
                    console.log("no tweets found");
                    process.exit(0);
                }

                const dirName = FileSystemUtil.createDirName();
                fs.mkdirSync(dirName);

                for (const staticFileName of ["normalize.css", "styles.css"]) {
                    const src = path.join("./templates", staticFileName);
                    const dest = path.join(dirName, staticFileName);

                    fs.copyFileSync(src, dest);
                }

                for (const tweet of tweets) {
                    tweet.autoLinkedText = TwitterText.autoLink(
                        tweet.originalTweet.text,
                        { urlEntities: tweet.originalTweet.entities.urls }
                    );

                    const src = path.join("./db/icons/", tweet.iconFileName);
                    const dest = path.join(dirName,  tweet.iconFileName);
                    fs.copyFileSync(src, dest);
                }

                /* tslint:disable:object-literal-sort-keys */
                const data = {
                    tweets,
                    images: [],                 // TODO: implement!
                };
                /* tslint:enable:object-literal-sort-keys */

                const env = Nunjucks.configure("templates");
                const indexFileName = path.join(dirName, "index.html");
                fs.writeFileSync(indexFileName, env.render("index.njk", data));
            })()
            .catch((error) => {
                console.log(error);
                process.exit(1);
            });
        });

    return commandLineParser;
}

(async () => {
    const tweetRepository = new TweetRepository();
    await tweetRepository.load();

    const commandLineParser = setUpCommandLineParser(tweetRepository);
    commandLineParser.parse(process.argv);
})()
.catch((error) => {
    console.log(error);
    process.exit(1);
});
