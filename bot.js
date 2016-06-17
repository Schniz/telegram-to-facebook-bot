import BotApi from 'telegram-bot-api';
import getUrls from 'get-urls';
import { Subject } from 'rx';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const {
	BOT_TOKEN,
	FB_GROUP,
	LOGINNER_URL,
	SECRET,
} = process.env;

function createJsonFromMessage(text) {
	return {
		signed: jwt.sign({
			text,
			groupId: FB_GROUP,
		}, SECRET),
	};
}

function sendJsonToLoginner(json) {
	console.log(json);

	return fetch(LOGINNER_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(json),
	}).then(e => e.json()).then(e => {
		console.log('response:', e)
	}).catch(err => {
		console.log('an error occured!', err);
	});
}

function toMessage({ user, urls }) {
	return [`a new message from ${user}:`].concat(urls).join('\n');
}

const maybeTakeReply = message => message.reply_to_message ? message.reply_to_message : message;

const convertMessage = message => ({
	urls: getUrls(message.text),
	user: `${message.from.first_name} ${message.from.last_name} (@${message.from.username})`,
});

const messages$ = new Subject();
messages$.subscribe(console.log, 'got message');
const toFullstack$ = messages$.filter(({ text }) => text.match(/\#fullstack/i));
const withReplies$ = toFullstack$.map(maybeTakeReply);
const urls$ = withReplies$.map(convertMessage);

urls$.subscribe(console.log);
urls$.filter(e => e.urls.length).map(toMessage).map(createJsonFromMessage).subscribe(sendJsonToLoginner);

const api = new BotApi({
	token: process.env.BOT_TOKEN,
	updates: {
		enabled: true,
	},
});

api.on('message', message => {
	messages$.onNext(message);
});

