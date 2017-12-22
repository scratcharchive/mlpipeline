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
function MLSDatasetListWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSDatasetListWidget');

	this.setMLSManager=function(M) {m_manager=M; m_study=M.study();};
	this.refresh=function() {refresh();};
	this.onCurrentDatasetChanged=function(handler) {JSQ.connect(m_table,'current_row_changed',O,handler);};
	this.currentDatasetId=function() {return currentDatasetId();};

	var m_manager=null;
	var m_study=null;
	var m_table=new MLTableWidget();
	m_table.setParent(O);
	m_table.setSelectionMode('single');
	m_table.setRowsMoveable(false);

	var m_button_bar=$('<div><button style="font-size:20px" id=add_dataset>Add dataset</button></div>');
	O.div().append(m_button_bar);

	m_button_bar.find('#add_dataset').click(add_dataset);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var button_height=40;

		m_button_bar.css({position:'absolute',left:0,top:H-button_height,width:W,height:button_height})

		m_table.setGeometry(0,0,W,H-button_height);
	}

	function currentDatasetId() {
		var row=m_table.currentRow();
		if (!row) return null;
		return row.dataset_id;
	}

	function refresh() {
		var current_dataset=currentDatasetId();

		m_table.clearRows();
		m_table.setColumnCount(2);
		m_table.headerRow().cell(1).html('Dataset');
		var ids=m_study.datasetIds();
		for (var i=0; i<ids.length; i++) {
			var row=m_table.createRow();
			row.dataset_id=ids[i];
			setup_row(row);
			m_table.addRow(row);
		}

		if (current_dataset) {
			set_current_row_by_dataset_id(current_dataset_id);
		}

		if (!m_table.currentRow()) {
			if (m_table.rowCount()>0) {
				m_table.setCurrentRow(m_table.row(0));	
			}
		}
	}

	function setup_row(row) {
		var close_link=$('<span class=remove_button title="Delete dataset"></span>');
		close_link.click(function() {remove_dataset(row.dataset_id);});
		row.cell(0).append(close_link);

		var edit_name_link=$('<span class=edit_button title="Edit dataset ID"></span>');
		edit_name_link.click(function(evt) {
			edit_dataset_id(row.dataset_id);
			return false; //so that we don't get a click on the row
		});
		row.cell(1).append(edit_name_link);
		row.cell(1).append($('<span>'+row.dataset_id+'</span>'));
	}

	function add_dataset() {
		var dataset_id=prompt('Dataset ID:');
		if (!dataset_id) return;
		m_study.setDataset(dataset_id,new MLSDataset());
		refresh();
		set_current_row_by_dataset_id(dataset_id);
	}

	function set_current_row_by_dataset_id(did) {
		for (var i=0; i<m_table.rowCount(); i++) {
			var row=m_table.row(i);
			if (row.dataset.dataset_id==did) {
				m_table.setCurrentRow(row);
				return;
			}
		}
	}

	function edit_dataset_id(ds_id) {
		var name=ds_id;
		var name2=prompt('New id for dataset:',name);
		if (!name2) return;
		if (name2==name) return;
		m_study.changeDatasetId(name,name2);
		refresh();
	}

	function remove_dataset(ds_id) {
		if (confirm('Remove dataset ('+ds_id+')?')) {
			m_study.removeDataset(ds_id);
			m_table.setCurrentRow(0);
			refresh();	
		}
	}

	update_layout();
}

