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

function mlpLog(msg) {
	GLOBAL_LOG.addMessage(msg);
}

function GlobalLog() {
	this.addMessage=function(msg) {addMessage(msg);};
	this.onMessage=function(handler) {m_message_handlers.push(handler);};

	var m_message_handlers=[];

	function addMessage(msg) {
		for (var i in m_message_handlers) {
			m_message_handlers[i](msg);
		}
	}
}
var GLOBAL_LOG=new GlobalLog();

function MLPLogWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLPLogWidget');
	O.div().css({'overflow-x':'scroll','overflow-y':'scroll'});

	var m_message_table=$('<table></table>');
	O.div().append(m_message_table);

	JSQ.connect(O,'sizeChanged',O,update_layout);
  	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_message_table.css({position:'absolute',left:0,top:0,width:W-5});
	}

	GLOBAL_LOG.onMessage(function(msg) {
		add_message(msg);
	});

	function add_message(msg) {
		var obj=O.div()[0];
		var at_bottom = ( ( (obj.scrollHeight - obj.offsetHeight) - obj.scrollTop) <10 );

		var elmt=$('<span>'+msg.text+'<span>');

		var tr=$('<tr></tr>');
		var td=$('<td></td>'); tr.append(td);
		td.append(elmt);

		m_message_table.append(tr);

		if (at_bottom) {
			var height = O.div()[0].scrollHeight;
	    	O.div().scrollTop(height);
	    }
	}

	update_layout();
}
