import * as fs from "fs";

import * as DateFns from "date-fns";

export function createDirName(): string {
    const tweetDate: string = DateFns.format(new Date(), "YYYY-MM-DD");

    const baseDirName = `./output-${tweetDate}`;

    let dirName: string;
    for (let i = 0; ; i++) {
        if (i === 0) {
            dirName = baseDirName;
        }
        else {
            dirName = `${baseDirName}_${i}`;
        }

        if (fs.existsSync(dirName) === false) {
            break;
        }
    }

    return dirName;
}
