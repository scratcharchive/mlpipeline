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
function JSQTabWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('JSQTabWidget');

	O.addTab=function(W,label) {addTab(W,label);};
	O.setCurrentTabIndex=function(ind) {set_current_tab_index(ind);};

	JSQ.connect(O,'sizeChanged',O,update_layout);

	var m_tabs=[];
	var m_current_tab_index=-1;
	var m_tab_bar=new JSQTabBar();
	m_tab_bar.setParent(O);

	JSQ.connect(m_tab_bar,'tabClicked',O,on_tab_clicked);

	function update_layout() {
		var tab_bar_height=30;
		var x0=0;
		var y0=0;
		//var y0=tab_bar_height;
		var W0=O.width(),H0=O.height()-tab_bar_height;
		for (var i in m_tabs) {
			var TT=m_tabs[i];
			TT.W.setSize(W0,H0);
			TT.W.setPosition(x0,y0);
		}
		m_tab_bar.setSize(O.width,tab_bar_height);
		m_tab_bar.setPosition(0,H0-2);
	}
	function update_visibility() {
		for (var i in m_tabs) {
			var TT=m_tabs[i];
			TT.W.setVisible(i==m_current_tab_index);
		}
	}
	function set_current_tab_index(ind) {
		if (m_current_tab_index==ind) return;
		m_current_tab_index=ind;
		update_layout();
		update_visibility();
		if (m_current_tab_index in m_tabs) {
			m_tab_bar.setCurrentTabName(m_tabs[m_current_tab_index].name);
		}
		else {
			m_tab_bar.setCurrentTabName('');
		}
	}
	function set_current_tab_index_by_name(name) {
		for (var i in m_tabs) {
			if (m_tabs[i].name==name) {
				set_current_tab_index(i);
				return;
			}
		}
	}

	function addTab(W,label) {
		W.setParent(O);
		var name=JSQ.makeRandomId();
		m_tabs.push({
			name:name,
			W:W,
			label:label
		});
		m_tab_bar.addTab(name,label);
		set_current_tab_index(m_tabs.length-1);
	}

	function on_tab_clicked(sender,name) {
		set_current_tab_index_by_name(name);
	}
}

function JSQTabBar(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass("JSQTabBar");

	var m_tabs=[];
	var m_current_tab_name='';

	O.addTab=function(name,label) {addTab(name,label);};
	O.setCurrentTabName=function(name) {setCurrentTabName(name);};

	function addTab(name,label) {
		m_tabs.push({name:name,label:label});
		update();
	}
	function update() {
		var table0=$('<table></table>');
		O.div().empty();
		O.div().append(table0);

		var tr=$('<tr></tr>');	
		table0.append(tr);
		for (var i=0; i<m_tabs.length; i++) {
			add_tab_to_tr(tr,m_tabs[i]);
		}
	}
	function add_tab_to_tr(tr,tab) {
		var X=$('<td><a href="#">'+tab.label+'</a></td>');
		X.click(function() {
			O.emit('tabClicked',tab.name);
		});
		X.attr('tab_name',tab.name);
		tr.append(X);
	}
	function setCurrentTabName(name) {
		if (m_current_tab_name==name) return;
		m_current_tab_name=name;
		update_element_classes();
	}
	function update_element_classes() {
		var tds=O.div().find('td');
		for (var i=0; i<tds.length; i++) {
			var td=$(tds[i]);
			if (td.attr('tab_name')==m_current_tab_name) td.addClass('current_tab');
			else td.removeClass('current_tab');
		}
	}
}