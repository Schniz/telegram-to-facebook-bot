import BotApi from 'telegram-bot-api';
import getUrls from 'get-urls';
import { Subject } from 'rx';
import nodemailer from 'nodemailer';

const {
	FROM_ADDR,
	BOT_TOKEN,
	SMTP_SERVER,
	FB_GROUP
} = process.env;

var transporter = nodemailer.createTransport(SMTP_SERVER);

function sendMail({ user, urls }) {
	var mailOptions = {
			from: FROM_ADDR, // sender address
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

const maybeTakeReply = message => message.reply_to_message ? message.reply_to_message : message;

const convertMessage = message => ({
	urls: getUrls(message.text),
	user: `${message.from.first_name} ${message.from.last_name} (@${message.from.username})`,
});

const messages$ = new Subject();
const messagesWithReplies$ = messages$.map(maybeTakeReply);
messagesWithReplies$.subscribe(console.log, 'got message');
const toFullstack$ = messagesWithReplies$.filter(({ text }) => text.match(/\#fullstack/i));
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

