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

function imageFileExistsWithBaseName(dirName: string, baseName: string): string | null {
    for (const iconExtension of ["jpg", "png"]) {
        const iconFullPath = path.join(dirName, `${baseName}.${iconExtension}`);

        if (fs.existsSync(iconFullPath)) {
            return `${baseName}.${iconExtension}`;
        }
    }

    return null;
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
                // console.log(JSON.stringify(tweet, null, 4));

                const iconDirName = "./db/icons/";
                if (fs.existsSync(iconDirName) === false) {
                    fs.mkdirSync(iconDirName);
                }

                const iconBaseFileName = tweet.user.screen_name;

                let iconFileName = imageFileExistsWithBaseName(iconDirName, iconBaseFileName);

                if (iconFileName === null) {
                    iconFileName = await downloadProfileImage(tweet.user.profile_image_url,
                        iconDirName, iconBaseFileName);
                }

                const mediaDirName = "./db/media/";
                if (fs.existsSync(mediaDirName) === false) {
                    fs.mkdirSync(mediaDirName);
                }

                const media = new Array<object>();
                if (tweet.extended_entities !== undefined) {
                    for (const mediaEntity of tweet.extended_entities.media) {
                        const mediaBaseName = mediaEntity.id_str;
                        let mediaFileName = imageFileExistsWithBaseName(mediaDirName, mediaBaseName);

                        if (mediaFileName === null) {
                            mediaFileName = await downloadMedia(mediaEntity.media_url, mediaDirName, mediaBaseName);
                        }

                        media.push({
                            fileName: mediaFileName,
                            height: mediaEntity.sizes.medium.h,
                            width: mediaEntity.sizes.medium.w
                        });
                    }
                }

                /* tslint:disable:object-literal-sort-keys */
                const newDoc = {
                    originalTweet : tweet,
                    iconFileName,
                    media,
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
                await tweetRepository.remove({ "originalTweet.id_str": tweetId });
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

                    const iconSrc = path.join("./db/icons/", tweet.iconFileName);
                    const iconDest = path.join(dirName,  tweet.iconFileName);
                    fs.copyFileSync(iconSrc, iconDest);

                    for (const media of tweet.media) {
                        const mediaSrc = path.join("./db/media/", media.fileName);
                        const mediaDest = path.join(dirName,  media.fileName);
                        fs.copyFileSync(mediaSrc, mediaDest);

                        if (media.width >= media.height && media.width > 400) {
                            const resizeRate = media.width / 400;
                            media.displayWidth = media.width / resizeRate;
                            media.displayHeight = media.height / resizeRate;
                        }
                        else if (media.height > media.width && media.height > 400) {
                            const resizeRate = media.height / 400;
                            media.displayWidth = media.width / resizeRate;
                            media.displayHeight = media.height / resizeRate;
                        }
                        else {
                            media.displayWidth = media.width;
                            media.displayHeight = media.height;
                        }
                    }
                }

                const env = Nunjucks.configure("templates");
                const indexFileName = path.join(dirName, "index.html");
                fs.writeFileSync(indexFileName, env.render("index.njk", { tweets }));
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
