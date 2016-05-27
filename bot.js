import BotApi from 'telegram-bot-api';
import getUrls from 'get-urls';
import { Subject } from 'rx';
import nodemailer from 'nodemailer';

const {
	BOT_TOKEN,
	SMTP_SERVER,
	FB_GROUP
} = process.env;

var transporter = nodemailer.createTransport(SMTP_SERVER);

function sendMail({ user, urls }) {
	var mailOptions = {
			from: '"Joe Hagever" <joe.hagever@gmail.com>', // sender address
			to: `${FB_GROUP}@groups.facebook.com`, // list of receivers
			subject: `a new message from ${user}`, // Subject line
			text: urls.join('\n'), // plaintext body
	};

	transporter.sendMail(mailOptions, function(error, info){
			if(error){
					return console.log(error);
			}
			console.log('message info', info);
			console.log('sent to', mailOptions);
	});
};

const convertMessage = message => {
	return {
		urls: getUrls(message.text),
		user: `${message.from.first_name} ${message.from.last_name} (@${message.from.username})`
	};
};

const messages$ = new Subject();
messages$.subscribe(console.log);
const toFullstack$ = messages$.filter(({ text }) => text.match(/\#fullstack/i));
const urls$ = toFullstack$.map(convertMessage);

urls$.subscribe(console.log);
urls$.filter(e => e.urls.length).subscribe(sendMail);

const api = new BotApi({
	token: process.env.BOT_TOKEN,
	updates: {
		enabled: true,
	},
});

api.on('message', message => {
	messages$.onNext(message);
});

