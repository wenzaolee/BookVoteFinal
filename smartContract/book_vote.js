"use strict";

var BookItem = function(text) {
	if (text) {
		var obj = JSON.parse(text);
		this.name = obj.name; // book name
		this.author = obj.author; // book author
		this.dynasty = obj.dynasty; // book dynasty
		this.introduction = obj.intruduction; // book introduction;
		this.voteCount = obj.voteCount; // vote count
		this.createdDate = obj.createdDate; // created date
		this.createdBy = obj.createdBy; // address who created the item
		this.lastModifiedDate = obj.lastModifiedDate; // lastMidified by
	} else {
		this.name = ""; // book name
		this.author = ""; // book author
		this.dynasty = ""; // dynasty
		this.introduction = ""; // book introduction;
		this.voteCount = 0; // vote count
		this.createdDate = new Date(); // created date
		this.createdBy = ""; // address who created the item
		this.lastModifiedDate = new Date(); // lastMidified by
	}
};

BookItem.prototype = {
	toString : function() {
		return JSON.stringify(this);
	}
};

var BookVote = function() {
	LocalContractStorage.defineMapProperty(this, "bookName2VoteMap"); 
	LocalContractStorage.defineMapProperty(this, "count2BookNameMap"); 
	LocalContractStorage.defineProperty(this, "totalBookCount"); 
	LocalContractStorage.defineProperty(this, "maxVoteCount"); 
};

BookVote.prototype = {
	init : function() {
		this.totalBookCount = 0;// total Book Count
		this.maxVoteCount = 0;// max Vote Count
	},

	addBook : function(name, author, dynasty, introduction) {
		name = name.trim();
		if (name == "") {
			throw new Error("书名不能为空");
		}
		if (name.length > 64) {
			throw new Error("书名长度不能超过64个字符")
		}
		if (author.length > 64) {
			throw new Error("作者长度不能超过64个字符")
		}
		if (dynasty.length > 64) {
			throw new Error("朝代长度不能超过64个字符")
		}
		if (introduction.length > 150) {
			throw new Error("简介长度不能超过150个字符")
		}
		if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) {
			throw new Error("书名只能由汉字,字母, 数字组成!");
		}
		var from = Blockchain.transaction.from;
		var bookItem = this.bookName2VoteMap.get(name);
		if (bookItem) {
			throw new Error("书名已经存在");
		}
		bookItem = new BookItem();
		bookItem.name = name; // book name
		bookItem.author = author.trim(); // book author
		bookItem.dynasty = dynasty.trim(); // book dynasty
		bookItem.introduction = introduction.trim(); // book introduction;
		bookItem.voteCount = 0; // vote count
		bookItem.createdDate = new Date(); // created date
		bookItem.createdBy = from; // address who created the item
		bookItem.lastModifiedDate = new Date(); // lastMidified by

		this.bookName2VoteMap.put(name, bookItem);
		this.totalBookCount++;

		var booKNames = this.count2BookNameMap.get(0);
		if (booKNames==null) {
			booKNames = new Array();
		} 
		booKNames.push(name);
		this.count2BookNameMap.put(0, booKNames);
	},

	modifyBook : function(name, author, dynasty, introduction) {
		name = name.trim();
		if (name == "") {
			throw new Error("书名不能为空");
		}
		if (author.length > 64) {
			throw new Error("作者长度不能超过64个字符")
		}
		if (dynasty.length > 64) {
			throw new Error("朝代长度不能超过64个字符")
		}
		if (introduction.length > 150) {
			throw new Error("简介长度不能超过150个字符")
		}
		var bookItem = this.bookName2VoteMap.get(name);
		if (bookItem) {
			bookItem.author = author.trim(); // book author
			bookItem.dynasty = dynasty.trim(); // book dynasty
			bookItem.introduction = introduction.trim(); // book
															// introduction;
			bookItem.lastModifiedDate = new Date(); // lastMidified by
			this.bookName2VoteMap.put(name, bookItem);
		} else {
			throw new Error("书名不存在");
		}
	},

	voteBook : function(name) {
		name = name.trim();
		if (name == "") {
			throw new Error("书名不能为空");
		}
		var bookItem = this.bookName2VoteMap.get(name);
		if (bookItem) {

			var oldBooKNames = this.count2BookNameMap.get(bookItem.voteCount);
			if (oldBooKNames) {
				for (var j = 0; j < oldBooKNames.length; j++) {
					if (oldBooKNames[j]==name) {
						oldBooKNames.splice(j,1);
					}
				}
				this.count2BookNameMap.put(bookItem.voteCount, oldBooKNames);
			}
			bookItem.voteCount++;
			bookItem.lastModifiedDate = new Date();
			var newBooKNames = this.count2BookNameMap.get(bookItem.voteCount);
			if (newBooKNames==null) {
				newBooKNames = new Array();
			} 
			newBooKNames.push(name);
			this.count2BookNameMap.put(bookItem.voteCount, newBooKNames);
			this.maxVoteCount = Math.max(this.maxVoteCount, bookItem.voteCount);
			this.bookName2VoteMap.put(name, bookItem);
		} else {
			throw new Error("书名不存在");
		}
	},

	getBook : function(name) {
		name = name.trim();
		if (name == "") {
			throw new Error("书名不能为空");
		}
		var bookItem = this.bookName2VoteMap.get(name);
		if (bookItem) {
			return JSON.stringify(bookItem);
		}
		return null;
	},

	getList : function(startIndex, pageSize) {
		if (isNaN(startIndex)) {
			throw new Error("startIndex 必须为数字");
		}
		if (isNaN(pageSize)) {
			throw new Error("pageSize 必须为数字");
		}
		if (startIndex <= 0) {
			throw new Error("startIndex 必须大于0 ");
		}
		if (pageSize <= 0) {
			throw new Error("pageSize 必须大于0 ");
		}

		var array = new Array();
		var currentIndex = 1;
		for (var voteCount = this.maxVoteCount; voteCount >= 0; voteCount--) {
			if (currentIndex >= startIndex + pageSize) {
				break;
			}
			var booKNames = this.count2BookNameMap.get(voteCount);
			if (booKNames) {
 				if (currentIndex + booKNames.length < startIndex) {
					currentIndex += booKNames.length;
					continue;
				}

				for (var j = 0; j < booKNames.length; j++) {
					var name = booKNames[j];
					if (currentIndex < startIndex) {
						currentIndex++;
						continue;
					}
					if (currentIndex >= startIndex + pageSize) {
						break;
					}
					var bookItem = this.bookName2VoteMap.get(name);
					if (bookItem) {
						var sampleItem = {
							name : bookItem.name,
							author : bookItem.author,
							dynasty : bookItem.dynasty,
							voteCount : bookItem.voteCount,
							totalBookCount : this.totalBookCount
						}
						array.push(sampleItem);
					}
					currentIndex++;
				}
			}
		}
		return JSON.stringify(array);
	}
};
module.exports = BookVote;