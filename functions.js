module.exports.func = function getWinLoss(num, player) {
    const wlFile = "WL.txt";
    let data = fs.readFileSync(wlFile, 'utf-8');
    let index = data.indexOf(player);

    let WL = data.substring(index + player.length + 1, data.indexOf(",", index + player.length + 1))

    console.log("WL for " + player + ": " + WL);

    if (num == 1) {
        // add 1 to wins
        let W = Number(WL.split("-")[0]) + 1;
        WL = W + "-" + WL.split("-")[1];
    } else if (num == 0) {
        // add 1 to loss
        let L = Number(WL.split("-")[1]) + 1;
        WL = WL.split("-")[0] + "-" + L;
    } else {
        throw new error("invalid win/loss");
    }

    let firstPart = data.substring(0, index + player.length + 1);
    let replacePart = WL;
    let lastPart = data.substring(data.indexOf(",", index + player.length + 1));

    console.log("First part is " + firstPart);
    console.log("Last part is " + lastPart);

    data = firstPart + replacePart + lastPart;

    fs.writeFileSync(wlFile, data, "utf-8");

    return WL;
}

module.exports.func = function toPrint(rank) {
    let data = fs.readFileSync(filename, 'utf-8');
    let index = data.indexOf(rank.split(" ")[0]);

    console.log("Index of " + rank.split(" ")[0] + " is " + index);
    console.log("Index of " + rank.split(" ")[1] + " is " + (index + rank.split(" ")[0].length + 1));

    let firstPart = data.substring(0, index + rank.split(" ")[0].length + 1);
    let replacePart = rank.split(" ")[1];
    let lastPart = data.substring(index + rank.length);

    console.log("First part is " + firstPart);
    console.log("Last part is " + lastPart);

    data = firstPart + replacePart + lastPart;

    fs.writeFileSync(filename, data, "utf-8");
}

module.exports.func = function getRating(player) {
    let data = fs.readFileSync(filename, 'utf-8');

    let pRatings = data.split(",");
    let rating = -1;
    for (let index = 0; index < pRatings.length; index++) {
        if (pRatings[index].split(" ")[0] === player) {
            //console.log("found player " + player);
            rating = pRatings[index].split(" ")[1];
            break;
        }
    }
    //console.log(rating);
    return Number(rating);
}

module.exports.func = function adjustRating(num, player, prob) {
    console.log("Prob " + player + ": " + prob);

    const K = 50;
    let rating = getRating(player);

    let elo = 0;

    if (num == 1) { // add elo
        console.log("K value for " + player + " :" + K * (1 - prob))
        elo = rating + K * (1 - prob) + 5;
    } else if (num == 0) { // lower elo
        console.log("K value for " + player + " :" + K * (0 - prob))
        elo = rating + (K / 3) * (0 - prob); // changed to 3 (higher=lose less, lower = lose more)
    } else {
        throw new error("invalid win/loss");
    }

    console.log(player + "'s new elo: " + elo + "(" + (elo - rating) + ")");

    return elo;
}

function calculateProbability(r1, r2) {
    return (1.0 / (1.0 + Math.pow(10, ((r2 - r1) / 400))));
}
