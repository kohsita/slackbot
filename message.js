"use strict";
var fs = require('fs'),
	path = require('path'),
	_ = require('lodash');

//正在寫入的message
var cache = {};
//已寫入的message
var data = {};
//寫入檔案名
var filename = '';
var message =
{
	addKey: function(key)
	{
		if(message.isExists(key))
		{
			return false;
		}
		cache[key] = {};
		return true;
	},

	addValue: function(key, value)
	{
		cache[key] = {
			value: value
		};
		data[key] = _.cloneDeep(cache[key]);
		message.writeFile((err) => {
			if(err)
			{
				console.log('write file error: ', err);
			}
		})
	},

	addMemo: function(key, memo)
	{
		cache[key].memo = memo.split(' ');
		data[key] = _.cloneDeep(cache[key]);
		message.writeFile((err) => {
			if(err)
			{
				console.log('write file error: ', err);
			}
		})
	},

	find: function(keyWord)
	{
		var result = [];
		var keyWords = keyWord.split(' ');
		//單字先找key
		if(keyWords.length == 1)
		{
			if(data.hasOwnProperty(keyWords[0]))
			{
				result.push(data[keyWords[0]]);
			}
		}

		//再找tag
		for(var key in data)
		{
			if(Array.isArray(data[key].memo) == false)
			{
				continue;
			}
			var matched = data[key].memo.some(function(m) {
				return (keyWords.indexOf(m) != -1);
			});

			if(matched)
			{
				result.push(data[key]);
			}
		}

		return result;
	},

	readFile: function(storage, callback)
	{
		filename = storage;
		var dirs = path.dirname(filename).split('/');
		for(var i = 0; i < dirs.length; ++i)
		{
			var dirName = dirs.slice(0, i + 1).join('/');
			if(!fs.existsSync(dirName))
			{
				fs.mkdirSync(dirName);
			}
		}
		fs.access(filename, fs.F_OK, (err) => {
			if(err)
			{
				callback(err);
				return;
			}

			fs.readFile(filename, (err, content) => {
				if(err) {
					callback(err);
					return;
				}
				_.assign(data, JSON.parse(content));
				callback(err);
			});
		});
	},

	writeFile: function(callback)
	{
		fs.access(filename, fs.F_OK, (err) => {
			if(err)
			{
				fs.appendFile(filename, JSON.stringify(data, null, '   '), (err) => {
					callback(err);
				});
				return;
			}
			fs.writeFile(filename, JSON.stringify(data, null, '   '), (err) => {
				callback(err);
			});

		});

	},

	//寫入時, 檢查key有無重覆
	isExists: function(key)
	{
		return (cache.hasOwnProperty(key) || data.hasOwnProperty(key));
	}
};

module.exports = message;