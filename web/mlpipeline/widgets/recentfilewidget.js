/*
 * Copyright 2016-2017 Flatiron Institute, Simons Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function RecentFileWidget(O,manager) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('RecentFileWidget');

	var m_recent_files=[];

	JSQ.connect(manager,'changed',O,refresh);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
	}

	function refresh() {
		O.div().empty();

		O.div().append('<h3>Recent files</h3>');
		var ul=$('<ul></ul>');
		O.div().append(ul);

		for (var i=0; i<manager.recentFileCount(); i++) {
			var file0=manager.recentFile(i);
			var li=$('<li><a href="#" id=file>'+file0.title+'</a></li>');
			li.find('#file').click(function() {});
			ul.append(li);
		}
		update_layout();
	}
	refresh();
}

function RecentFileManager() {
	O=O||this;
	JSQObject(O);

	this.toObject=function() {return toObject();};
	this.fromObject=function(obj) {fromObject(obj); O.emit('changed');};
	this.recentFileCount=function() {return m_recent_files.length;};
	this.recentFile=function(i) {return JSQ.clone(m_recent_files[i]);};
	this.removeRecentFileAt=function(i) {m_recent_files.splice(i,1); O.emit('changed');};
	this.addRecentFile=function(file0) {m_recent_files.push(JSQ.clone(file0)); O.emit('changed');};

	var m_recent_files=[];

	function toObject() {
		return JSQ.clone({
			recent_files:m_recent_files
		});
	}
	function fromObject(obj) {
		var obj2=JSQ.clone(obj);
		m_recent_files=obj2.recent_files||[];
	}
}
