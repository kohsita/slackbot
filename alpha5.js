'use strict';
var Botkit = require('botkit');
var MessageManager = require('./message.js');

var config = require('ncon');
config.init(__dirname + '/config');
var appConfig = config.get('app');
if(!appConfig.storage)
{
	throw new Error('no storage setting');
}
MessageManager.readFile(appConfig.storage, (err) => {
	if(err)
	{
		console.log('read file error: ', err);
	}
});
var controller = Botkit.slackbot();
var slackBot = controller.spawn({token: appConfig.token});
function start_RTM()
{
	slackBot.startRTM(function(err) {
		if(err)
		{
			console.log('start RTM error: %j', err);
		}
	});
}
start_RTM();

controller.on('rtm_close', function(bot, err) {
	console.log('rtm closed.');
	start_RTM();
});
controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {
	console.log('hear message: %j', message);
	bot.reply(message, '你好.');
});

controller.hears(['密我'], ['mention','direct_mention'], function(bot, message) {
	bot.say({
		text: '好der，已密',
		channel: message.channel
	});

	bot.startPrivateConversation(message, function(err, dm) {
		dm.say('優奢摸施');
	});
});

//加入channel回應
controller.on('channel_joined', function(bot, message) {

	bot.say({
		text: '薛薛泥邀清窩',
		channel: message.channel.id
	});
});

//新增記事
controller.hears(['remember:'], ['direct_message', 'mention', 'direct_mention'], function(bot,message) {
	var neverMind = {
		pattern: bot.utterances.quit,
		callback: function(response, convo) {
			convo.say('Hmmm...fine...');
			convo.next();
		}
	};

	var inputKey = '';
	var askKey = function(err, convo) {
		convo.ask('Okay, what is the key?', [
			neverMind,
			{
				default: true,
				callback: function(response, convo) {
					console.log('response: %j', response);

					inputKey = response.text;
					if(MessageManager.isExists(inputKey))
					{
						convo.say('Sorry, this key is in use.');
						confirmOverride(response, convo);
					}
					else
					{
						convo.say('the key is ' + response.text);
						MessageManager.addKey(inputKey);
						askValue(response, convo);
					}
					convo.next();
				}
			}
		]);
	};
	var confirmOverride = function(response, convo) {
		convo.ask('wanna override?', [
			{
				pattern: bot.utterances.yes,
				callback: function(response, convo) {
					convo.say('As you wish.');
					askValue(response, convo);
					convo.next();
				}
			},
			{
				default: true,
				callback: function(response, convo) {
					convo.say('Good.');
					askKey(null, convo);
					convo.next();
				}
			}
		]);
	};
	var askValue = function(response, convo) {
		convo.ask('and the value is...', [
			neverMind,
			{
				default: true,
				callback: function(response, convo) {
					convo.say('Okay.');
					MessageManager.addValue(inputKey, response.text);
					askTag(response, convo);
					convo.next();
				}
			}
		]);
	};
	var askTag = function(response, convo) {
		convo.ask('Wanna add some memo?', [
			neverMind,
			{
				default: true,
				callback: function(response, convo) {
					//if(str.match(bot.utterances.no).length == 0)
					MessageManager.addMemo(inputKey, response.text);
					convo.say('Okay! It\'s done.');
					convo.next();
				}
			}
		]);
	};
	console.log("remember: %j", message);
	bot.startConversation(message, askKey);
});
controller.hears(['tell me:'], ['direct_message', 'mention', 'direct_mention'], function(bot,message) {
	var neverMind = {
		pattern: bot.utterances.quit,
		callback: function(response, convo) {
			convo.say('Hmmm...fine...');
			convo.next();
		}
	};

	var askKeyWord = function(err, convo) {
		convo.ask('What do u wanna know?', [
			neverMind,
			{
				default: true,
				callback: function(response, convo) {
					console.log('response: %j', response);

					var attachments = MessageManager.find(response.text).map(function(doc) {
						var memo = doc.memo.map(function(m) {
							return {
								label: 'Field',
								value: m,
								short: true
							}
						});

						return  {
							title: doc.value,
							color: '#FFCC99',
							fields: memo
						}
					});
					console.log('attachments: %j', attachments);
					if(attachments.length == 0)
					{
						convo.say('Nothing I can tell you');
					}
					else
					{
						convo.say({
							text: 'Oh, here you are.',
							attachments: attachments
						},function(err,resp) {
							console.log(err,resp);
						});
					}

					convo.next();
				}
			}
		]);
	};

	bot.startConversation(message, askKeyWord);
});
controller.hears([/power ranger/gi], ['direct_message', 'mention', 'direct_mention'], function(bot,message) {

	// do something...

	// then respond with a message object
	//
	bot.reply(message,{
		text: "狗狗睪丸被割 :dog2:"
	});

});

controller.hears(['help'], ['direct_message', 'mention','direct_mention'], function(bot, message) {
	bot.say({
		text: '使用 `remember:` 幫你記事',
		channel: message.channel
	});

	bot.say({
		text: '使用 `tell me:` 問我',
		channel: message.channel
	});
});

/*
controller.hears(['leave channel'],['direct_message','direct_mention'],function(bot,message) {

	bot.api.channels.leave({channel: "C4HS6C1PD"}, function(message2){
		console.log('channel leave: %j', message2);
		bot.reply(message, "yes sir");
	});

});*/