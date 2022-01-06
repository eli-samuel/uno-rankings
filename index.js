const Discord = require("discord.js");
const bot = new Discord.Client();
const token = "OTI4NTQ0NTUwOTg3ODkwNzI4.YdaUgA.ypjCq6rcriwAuNKohAY0ihfGDXs";
const prefix = "UNO"
const fetch = require("node-fetch");

const fs = require('fs');
const path = require('path');
const { get } = require("http");
const { error } = require("console");

const filename = "players.txt";

const updateEmbed = new Discord.MessageEmbed() //https://discordjs.guide/popular-topics/embeds.html
    .setColor('#E74C3C')
    .setTitle('An UNO Game has been completed')
    .setURL('https://devpost.com/software/carbonbot')
    .setAuthor('UNO Rankings',
        'https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .setDescription("Here are this game's results: ")
    .setThumbnail('https://www.pinclipart.com/picdir/big/95-951998_worlds-smallest-uno-u-s-uno-play-card-game.png')
    .addFields(
        { name: "arabel's new elo: **838** (+8) ", value: "you don't suck!", inline: false },
        { name: "beks's new elo: **390** (-5)", value: "you suck!", inline: true },
        { name: "eli's new elo: **365** (-5)", value: "you suck!", inline: true },
        { name: "bot's new elo: **362** (-5)", value: "you suck!", inline: true },
    )
    .setTimestamp()
    .setFooter('ggez');

bot.login(token);

bot.on('ready', () => {
    console.log("Logged in as " + bot.user.tag);
});

// test function
bot.on("message", msg => {
    if (msg.author == bot.user) return; // Prevent bot from responding to its own messages

    // test cases
    if (msg.content === "ayy") msg.channel.send("lmao");

    if (msg.content.startsWith(prefix)) {
        // eli 100,arabel 200,beks 300
        console.log("=======================");
        let message = msg.content;

        let players = msg.content.split(" ");
        players.shift();

        console.log(players);
        if (players.length > 4) {
            console.log("Too many players");
            msg.channel.send("Invalid number of players, please try again.");
            return;
        }

        // msg.channel.send("An UNO Game has completed.");

        let winner = players[0];
        let wOtherAvg = 0;
        for (let i = 1; i < players.length; i++) {
            wOtherAvg += getRating(players[i]);
        }
        wOtherAvg /= (players.length - 1);
        console.log("Average game rating for " + winner + ": " + wOtherAvg);
        let wRating = getRating(winner);
        let wProb = calculateProbability(wRating, wOtherAvg);
        let wElo = Math.round(adjustRating(1, winner, wProb));
        if (wElo > 1000) wElo = 1000;
        msg.channel.send(winner + "'s new elo: **" + wElo + "** (*" + (wElo - wRating) + "*) WINNER!");
        toPrint(winner + " " + wElo + ",");

        let lRating = [];

        for (let index = 1; index < players.length; index++) {
            let lOtherAvg = 0;
            for (let i = 0; i < players.length; i++) {
                if (index == i) { continue; }
                else { lOtherAvg += getRating(players[i]); }
            }
            lOtherAvg /= (players.length - 1);
            console.log("Average game rating for " + players[index] + ": " + wOtherAvg);

            let lPlayer = players[index];
            let lRating = getRating(lPlayer);
            let lProb = calculateProbability(lRating, lOtherAvg);
            let lElo = Math.round(adjustRating(0, lPlayer, lProb));
            if (lElo < 0) lElo = 0;
            msg.channel.send(lPlayer + "'s new elo: **" + lElo + "** (*" + (lElo - lRating) + "*)");
            toPrint(lPlayer + " " + lElo + ",");
        }

        msg.channel.send(updateEmbed);
    }
});

function toPrint(rank) {
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

function getRating(player) {
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

function adjustRating(num, player, prob) {
    console.log("Prob " + player + ": " + prob);

    const K = 50;
    let rating = getRating(player);

    let elo = 0;

    if (num == 1) { // add elo
        console.log("K value for " + player + " :" + K * (1 - prob))
        elo = rating + K * (1 - prob) + 5;
    } else if (num == 0) { // lower elo
        console.log("K value for " + player + " :" + K * (0 - prob))
        elo = rating + (K / 3) * (0 - prob); // /3 since you lose 3/4 games on average
    } else {
        throw new error("invalid win/loss");
    }

    console.log(player + "'s new elo: " + elo + "(" + (elo - rating) + ")");

    return elo;
}

function calculateProbability(r1, r2) {
    return (1.0 / (1.0 + Math.pow(10, ((r2 - r1) / 400))));
}