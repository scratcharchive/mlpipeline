function MLPipelineListWidget(O,pipeline_list_manager) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLPipelineListWidget');

	this.currentPipeline=function() {return m_current_pipeline;};
	this.setCurrentPipeline=function(P) {setCurrentPipeline(P);};

	var m_table=new MLTableWidget();
	m_table.setParent(O);
	m_table.setSelectionMode('single');
	m_table.setRowsMoveable(true);
	var m_pipeline_rows=[];
	var m_current_pipeline=null;

	JSQ.connect(m_table,'rows_moved',O,on_rows_moved);

	JSQ.connect(m_table,'current_row_changed',O,function() {
		var row=m_table.currentRow();
		if ((row)&&(row.pipeline)) {
			O.setCurrentPipeline(row.pipeline);
			O.emit('current_pipeline_changed');
		}
		
	});

	JSQ.connect(pipeline_list_manager,'changed',O,schedule_refresh);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		m_table.setSize(W,H);	
	}

	var m_refresh_scheduled=false;
	function schedule_refresh() {
		if (m_refresh_scheduled) return;
		m_refresh_scheduled=true;
		setTimeout(function() {
			m_refresh_scheduled=false;
			refresh();
		},100);
	}

	function refresh() {
		m_pipeline_rows=[];
		m_table.clearRows();
		m_table.setColumnCount(2);
		m_table.headerRow().cell(1).html('Pipeline');
		for (var i=0; i<pipeline_list_manager.pipelineCount(); i++) {
			var P=pipeline_list_manager.pipeline(i);
			var row=m_table.createRow();
			row.setIsMoveable(true);
			row.pipeline_index=i;
			row.pipeline=P;
			setup_row(row);
			m_pipeline_rows.push(row);
			m_table.addRow(row);
		}

		var row0=m_table.createRow();
	    m_table.addRow(row0);
	    var add_button=$('<a id=add href="#">Add pipeline</a>');
	    add_button.click(add_pipeline);
	    row0.cell(1).append(add_button);

	    var row0=m_table.createRow();
	    m_table.addRow(row0);
	    var add_button2=$('<a id=add href="#">Add script</a>');
	    add_button2.click(add_script);
	    row0.cell(1).append(add_button2);

	    //update_layout();
	    if (m_current_pipeline) {
	    	O.setCurrentPipeline(m_current_pipeline);
	    }
	}

	function on_rows_moved() {
		var new_pipeline_order=[];
		for (var i=0; i<m_table.rowCount(); i++) {
		  var row=m_table.row(i);
		  if (row.pipeline_index>=0) {
		    new_pipeline_order.push(row.pipeline_index);
		    row.pipeline_index=i; //after reordering this will be the correct pipeline_index
		  }
		}
		pipeline_list_manager.reorderPipelines(new_pipeline_order);
	}

	function setup_row(row) {
		var P=row.pipeline;
		var remove_button=$('<a class=remove_button title="Remove pipeline" />');
		remove_button.click(function() {remove_pipeline(row.pipeline);});
		row.cell(0).empty();
		row.cell(0).append(remove_button);

		var Name=$('<span />');
		var edit_button=$('<span class="edit_button" />');
	    edit_button.click(function() {edit_row(row);});
	    Name.append(edit_button);
	    Name.append('&nbsp;');
	    Name.append(P.name());
	      
	    row.cell(1).empty();
		row.cell(1).append(Name);
	}

	function edit_row(row) {
		var P=row.pipeline;
		var name2=prompt('Name of pipeline: ',P.name());
	    if ((name2)&&(name2!=name)) {
	    	P.setName(name2);
	    }
	}

	function remove_pipeline(pipeline) {
		if (confirm('Remove pipeline: '+pipeline.name()+'?')) {
	      pipeline_list_manager.removePipeline(pipeline);
	    }
	}

	function add_pipeline() {
		var name0=prompt('New pipeline name:','untitled');
		if (!name0) return;
		var P=new MLPipeline();
		P.setName(name0);
		pipeline_list_manager.addPipeline(P);
		O.setCurrentPipeline(P);
	}

	function add_script() {
		var name0=prompt('New pipeline script name:','untitled');
		if (!name0) return;
		var P=new MLPipelineScript();
		P.setName(name0);
		pipeline_list_manager.addPipeline(P);
		O.setCurrentPipeline(P);
	}

	function setCurrentPipeline(P) {
		m_current_pipeline=P;
		for (var i in m_pipeline_rows) {
			var row=m_pipeline_rows[i];
			if (row.pipeline==P) {
				m_table.setCurrentRow(row);
				return;
			}
		}
	}

	refresh();
}