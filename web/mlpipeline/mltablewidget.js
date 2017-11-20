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
function MLTableWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLTableWidget');

	this.setColumnCount=function(num) {setColumnCount(num);}; 
	this.clearRows=function() {m_rows=[]; schedule_refresh();};
	this.createRow=function() {return createRow();};
	this.addRow=function(row) {m_rows.push(row); schedule_refresh();}
	this.rowCount=function() {return m_rows.length;};
	this.row=function(i) {return m_rows[i];};
	this.headerRow=function() {return m_header_row;};
	this.columnCount=function() {return m_column_properties.length;}
	this.setColumnProperties=function(colnum,props) {setColumnProperties(colnum,props);};
	this.setRowsMoveable=function(val) {m_rows_moveable=val; schedule_refresh();};
	this.rowsMoveable=function() {return m_rows_moveable;};
	this.setSelectionMode=function(mode) {m_selection_mode=mode;}; //none,single
	this.selectionMode=function() {return m_selection_mode;};
	this.currentRow=function() {return m_current_row;};
	this.setCurrentRow=function(row) {setCurrentRow(row);};

	var m_table=$('<table class=Table1></table>');
	O.div().append(m_table);
	O.div().css({'overflow':'auto'})
	var m_header_row=new MLTableWidgetHeaderRow(0,O);

	var m_rows=[];
	var m_column_properties=[];
	var m_rows_moveable=false;
	var m_current_row=null;
	var m_selection_mode='none'; //see above for list of possibilities

	function setColumnCount(num) {
		m_header_row.setColumnCount(num);
		m_column_properties=[];
		for (var i=0; i<num; i++) {
			m_column_properties.push({});
		}
		schedule_refresh();
	}
	function setColumnProperties(colnum,props) {
		for (var key in props) {
			if ((key=='max-width')||(key=='min-width')||(key=='width')) {
				m_header_row.cell(colnum).css({key:props[key]});
			}
		}
		schedule_refresh();
	}
	function setCurrentRow(row) {
		if (m_current_row==row) return;
		m_current_row=row;
		O.emit('current_row_changed');
		update_row_highlighting();
	}
	function update_row_highlighting() {
		for (var i in m_rows) {
			m_rows[i].tr().removeClass('selected');
		}
		if (m_current_row) {
			m_current_row.tr().addClass('selected');
		}
	}
	function createRow() {
		var row=new MLTableWidgetRow(0,O);
		JSQ.connect(row,'clicked',O,function(sender,evt) {
			if (m_selection_mode=='single') {
				setCurrentRow(row);
			}
		});
		return row;
	}
	var m_refresh_scheduled=false;
	function schedule_refresh() {
		if (m_refresh_scheduled) return;
		m_refresh_scheduled=true;
		setTimeout(function() {
			m_refresh_scheduled=false;
			refresh();
		},10);
	}
	function refresh() {
		m_table.children().detach(); //important to do this before empty so we retain the jquery data on the elements!
		m_table.empty();
		m_table.append(m_header_row.tr());
		var tbody=$('<tbody />');
		m_table.append(tbody);
		for (var i=0; i<m_rows.length; i++) {
			tbody.append(m_rows[i].tr());
		}
		update_row_highlighting();
	}

	function move_row(src_row_index,dst_row_index) {
		if (src_row_index==dst_row_index) return;
		var row0=m_rows[src_row_index];
		m_rows.splice(src_row_index,1); //remove
		if (src_row_index<dst_row_index) dst_row_index--;
		m_rows.splice(dst_row_index,0,row0); //insert
		refresh();
		O.emit('rows_moved');
	}

	var m_is_dragging=false;
	var m_drag_row_index=-1;
	var m_drop_row_index=-1;
	O.div().mousedown(function(evt) {
		var x0=evt.pageX;
		var y0=evt.pageY;
		var ind=drag_handle_at(x0,y0);
		if (ind>=0) {
			m_is_dragging=true;
			m_drag_row_index=ind;
			m_drop_row_index=ind;
			update_drag_animation();
			evt.preventDefault();
		}
	});
	O.div().mousemove(function(evt) {
		if (!m_is_dragging) return;
		var x0=evt.pageX;
		var y0=evt.pageY;
		var ind=row_at(x0,y0);
		if ((ind>=0)&&(m_rows[ind].isMoveable())) {
			if (ind<=m_drag_row_index)
				m_drop_row_index=ind;
			else
				m_drop_row_index=ind+1;
			update_drag_animation();
		}
		evt.preventDefault();
	});
	O.div().mouseup(function(evt) {
		if (!m_is_dragging) return;
		move_row(m_drag_row_index,m_drop_row_index);
		m_is_dragging=false;
		update_drag_animation();
		evt.preventDefault();
	});
	function update_drag_animation() {
		for (var i in m_rows) {
			var row=m_rows[i];
			if ((m_is_dragging)&&(m_drop_row_index==i)) {
				row.setDragDropDestination(true);
			}
			else {
				row.setDragDropDestination(false);	
			}
			if ((m_is_dragging)&&(m_drag_row_index==i)) {
				row.setDragDropSource(true);
			}
			else {
				row.setDragDropSource(false);	
			}
		}
	}
	function row_at(x0,y0) {
		for (var i=0; i<m_rows.length; i++) {
			var X=m_rows[i].tr();
			var offset0=X.offset();
			var x1=offset0.left,y1=offset0.top;
			var w1=X.innerWidth(),h1=X.innerHeight();
			if ((x1<=x0)&&(x0<=x1+w1)&&(y1<=y0)&&(y0<=y1+h1))
				return i;
		}
		return -1;
	}
	function drag_handle_at(x0,y0) {
		for (var i=0; i<m_rows.length; i++) {
			var DH=m_rows[i].dragHandle();
			if (DH) {
				var offset0=DH.offset();
				var x1=offset0.left,y1=offset0.top;
				var w1=DH.innerWidth(),h1=DH.innerHeight();
				if ((x1<=x0)&&(x0<=x1+w1)&&(y1<=y0)&&(y0<=y1+h1))
					return i;
			}
		}
		return -1;
	}

	refresh();
}

function MLTableWidgetHeaderRow(O,table_widget) {
	this.tr=function() {return m_tr;};
	this.setColumnCount=function(num) {setColumnCount(num);};
	this.cell=function(index) {return m_cells[index];};

	var m_tr=$('<tr />');
	var m_cells=[];

	function setColumnCount(num) {
		m_tr.empty();
		if (table_widget.rowsMoveable())
			m_tr.append('<th />');
		m_cells=[];
		for (var i=0; i<num; i++) {
			var cell=$('<th></th>');
			m_cells.push(cell);
			m_tr.append(cell);
		}
	}
}

function MLTableWidgetRow(O,table_widget) {
	O=O||this;
	JSQObject(O);

	this.tr=function() {return m_tr;};
	this.cell=function(index) {return m_cells[index];};
	this.isMoveable=function() {return m_is_moveable;};
	this.setIsMoveable=function(val) {setIsMoveable(val);};
	this.dragHandle=function() {if (m_is_moveable) return m_drag_handle; else return null;};
	this.setDragDropSource=function(val) {if (m_drag_drop_source==val) return; m_drag_drop_source=val; update_drag_animation();};
	this.setDragDropDestination=function(val) {if (m_drag_drop_destination==val) return; m_drag_drop_destination=val; update_drag_animation();};

	var m_tr=$('<tr />');
	var m_cells=[];
	var m_is_moveable=false;
	var m_table_widget=table_widget;
	var m_drag_handle=$('<td class=table_row_drag_handle><span /></td>');
	var m_drag_drop_source=false;
	var m_drag_drop_destination=false;

	m_tr.click(function(evt) {
		O.emit('clicked',evt);
	});

	setIsMoveable(false);

	function setIsMoveable(val) {
		m_is_moveable=val;
		if (m_is_moveable) {
			m_drag_handle.find('span').css({visibility:''});
			m_drag_handle.css({cursor:'move'});
		}
		else {
			m_drag_handle.find('span').css({visibility:'hidden'});
			m_drag_handle.css({cursor:'default'});
		}
	}

	function update_drag_animation() {
		if (m_drag_drop_source)
			m_tr.addClass('drag_drop_source');
		else
			m_tr.removeClass('drag_drop_source');
		if (m_drag_drop_destination)
			m_tr.addClass('drag_drop_destination');
		else
			m_tr.removeClass('drag_drop_destination');
	}

	function set_column_count(num) {
		m_tr.empty();
		if (m_table_widget.rowsMoveable())
			m_tr.append(m_drag_handle);
		for (var i=0; i<num; i++) {
			var cell=$('<td />');
			m_cells.push(cell);
			m_tr.append(cell);
		}
	}
	set_column_count(m_table_widget.columnCount());	

}