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

function sendMail(url) {
	var mailOptions = {
			from: '"Joe Hagever" <joe.hagever@gmail.com>', // sender address
			to: `${FB_GROUP}@groups.facebook.com`, // list of receivers
			subject: 'a new message', // Subject line
			text: url, // plaintext body
	};

	transporter.sendMail(mailOptions, function(error, info){
			if(error){
					return console.log(error);
			}
			console.log('message info', info);
			console.log('sent to', mailOptions);
	});
}


const head = arr => arr[0];
const messages$ = new Subject();
const toFullstack$ = messages$.filter(({ text }) => text.match(/\#fullstack/i));
const texts$ = toFullstack$.pluck('text');
const urls$ = texts$.flatMap(getUrls);

urls$.subscribe(sendMail);

const api = new BotApi({
	token: process.env.BOT_TOKEN,
	updates: {
		enabled: true,
	},
});

api.on('message', message => {
	messages$.onNext(message);
});

