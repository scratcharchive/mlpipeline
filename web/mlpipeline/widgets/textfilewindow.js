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
function TextFileWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('TextFileWindow');

	this.setTitle=function(title) {m_title=title;};
	this.setText=function(text) {m_text=text;};
	this.show=function() {show();};

	var m_title='';
	var m_text='';

	var m_text_area=$('<textarea readonly></textarea>');

	O.div().append(m_text_area);

	function show() {
		O.setSize(600,400);
		var W=O.width();
		var H=O.height();
		m_text_area.css({position:'absolute',left:20,top:20,width:W-40,height:H-40,overflow:'auto'});
		m_dialog=$('<div id="dialog"></div>');
		
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:false,
		              title:m_title});

		m_text_area.val(m_text);
	}
}