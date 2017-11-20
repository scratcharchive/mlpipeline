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
function EditMLPipelineWidget(O,processor_manager) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('EditMLPipelineWidget');

	this.setPipeline=function(pipeline) {setPipeline(pipeline);};
	this.editorIsDirty=function() {return m_button_widget.editorIsDirty();};
	this.updateFromEditors=function() {updateFromEditors();};
	this.setJobManager=function(JM) {m_job_manager=JM; m_table_widget.setJobManager(JM);};

	var m_pipeline=null;
	var m_script_editor_div=$('<div><textarea /></div>');
	var m_editor_div=$('<div />');
	var m_button_widget=new EditMLPipelineButtonWidget();
	var m_job_manager=null;
	var m_table_widget=new EditMLPipelineTableWidget(0,processor_manager);
	O.div().append(m_editor_div);
	O.div().append(m_script_editor_div);
	O.div().append(m_button_widget.div());
	m_table_widget.setParent(O);
	JSQ.connect(m_table_widget,'start_job',O,function(sender,args) {O.emit('start_job',args);});
	JSQ.connect(m_table_widget,'stop_job',O,function(sender,args) {O.emit('stop_job',args);});

	var m_editor=new JSONEditor(m_editor_div[0], {/*mode:'form',*/mode:'code',onChange:on_editor_changed});
	var m_script_editor=CodeMirror.fromTextArea(m_script_editor_div.find('textarea')[0], {
    	lineNumbers: true,
    	mode: "javascript",
    	lint:true,
    	gutters: ["CodeMirror-lint-markers"]
  	});
  	m_script_editor.on('change',on_script_editor_changed);
	update_mode();
	JSQ.connect(m_button_widget,'mode_changed',O,update_mode);
	JSQ.connect(m_button_widget,'update',O,on_update);
	update_layout();

	JSQ.connect(m_table_widget,'pipeline_edited',O,function() {
		m_pipeline.setObject(m_table_widget.pipelineObject());
	});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var H1=Math.max(200,H/4);
		var H2=30;
		var spacing1=30;

		m_editor_div.css({left:0,top:20,width:W,height:H-H2-40,position:'absolute'});
		m_script_editor_div.css({left:0,top:20,width:W,height:H-H2-40,position:'absolute'});
		m_script_editor.setSize(W,H-H2-40);
		m_button_widget.setGeometry(0,H-H2,W,H2);
		m_table_widget.setGeometry(0,0,W,H-H2-20);

		m_table_widget.hide();
		m_editor_div.css({visibility:'hidden'});
		m_script_editor_div.css({visibility:'hidden'});

		var mode=m_button_widget.mode();
		if (mode=='table') {
			m_table_widget.show();
		}
		else if (mode=='script') {
			m_script_editor_div.css({visibility:'visible'});
			m_script_editor.refresh();
		}
		else if (mode=='code') {
			m_editor_div.css({visibility:'visible'});
		}
	}

	function setPipeline(pipeline) {
		m_pipeline=pipeline;
		do_set_content();

		pipeline.onChanged(function() {
			do_set_content();
		});

		m_button_widget.setIsPipelineScript(m_pipeline.isPipelineScript());

		function do_set_content() {
			set_to_script_editor_if_different(m_script_editor,pipeline.object().script||'');
			m_table_widget.setPipelineObject(pipeline.object());
			set_to_editor_if_different(m_editor,pipeline.object());
		}
	}
	function set_to_editor_if_different(editor,obj) {
		if (JSON.stringify(obj)==JSON.stringify(editor.get())) return;
		editor.set(obj);
	}
	function set_to_script_editor_if_different(script_editor,txt) {
		if (txt==script_editor.getValue()) return;
		script_editor.setValue(txt);
	}
	function update_mode() {
		if ((m_button_widget.mode()!='table')&&(m_button_widget.mode()!='script')) {
			m_editor.setMode(m_button_widget.mode());
		}
		update_layout();
	}
	function on_update() {
		if (!m_pipeline) return;
		if (m_pipeline.isPipelineScript()) {
			var obj=m_pipeline.object();
			obj.script=m_script_editor.getValue()||'';
			m_pipeline.setObject(obj);
		}
		else {
			var obj=m_editor.get();
			m_pipeline.setObject(obj);
		}
		m_button_widget.setEditorDirty(false);
	}
	function on_editor_changed() {
		schedule_editor_changed();
	}
	function on_script_editor_changed() {
		schedule_editor_changed();
	}
	var m_editor_changed_scheduled=false;
	function schedule_editor_changed() {
		if (m_editor_changed_scheduled) return;
		m_editor_changed_scheduled=true;
		setTimeout(function() {
			m_editor_changed_scheduled=false;
			do_editor_changed();
		},500);
	}
	function do_editor_changed() {
		var dirty=false;
		if (m_pipeline) {
			if (m_pipeline.isPipelineScript()) {
				if ((m_pipeline.object().script||'')!=m_script_editor.getValue()) dirty=true;	
			}
			else {
				if (JSON.stringify(m_pipeline.object())!=JSON.stringify(m_editor.get())) dirty=true;
			}
		}
		m_button_widget.setEditorDirty(dirty);
	}
	function updateFromEditors() {
		on_update();
	}
	setPipeline(new MLPipeline());
}

function EditMLPipelineButtonWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('EditMLPipelineButtonWidget');

	this.mode=function() {return m_mode;};
	this.setEditorDirty=function(val) {m_editor_dirty=val; update_content();};
	this.editorIsDirty=function() {return m_editor_dirty;};
	this.setIsPipelineScript=function(val) {setIsPipelineScript(val);};

	var m_mode='table';
	var m_editor_dirty=false;
	var m_is_pipeline_script=false;

	O.div().html('<span><a href=# id=table>Table view</a>&nbsp;<a href=# id=script>Script view</a>&nbsp;<a href=# id=code>Code view</a>&nbsp;<a href=# id=tree>Tree view</a>&nbsp;&nbsp;&nbsp;<a href=# id=update>Update</a></span>')
	O.div().find('#table').click(function() {
		m_mode='table';
		O.emit('mode_changed');
		update_content();
	});
	O.div().find('#script').click(function() {
		m_mode='script';
		O.emit('mode_changed');
		update_content();
	});
	O.div().find('#code').click(function() {
		m_mode='code';
		O.emit('mode_changed');
		update_content();
	});
	O.div().find('#tree').click(function() {
		m_mode='tree';
		O.emit('mode_changed');
		update_content();
	});
	O.div().find('#update').click(function() {
		O.emit('update');
	});
	update_content();

	function setIsPipelineScript(val) {
		if (val==m_is_pipeline_script) return;
		m_is_pipeline_script=val;
		if (m_is_pipeline_script) {
			if (m_mode!='script') {
				m_mode='script';
				O.emit('mode_changed');
			}
		}
		else {
			if (m_mode=='script') {
				m_mode='table';
				O.emit('mode_changed');
			}
		}
		update_content();
	}

	function update_content() {
		O.div().find('#table').css({color:'black'});
		O.div().find('#script').css({color:'black'});
		O.div().find('#code').css({color:'black'});
		O.div().find('#tree').css({color:'black'});
		O.div().find('#'+m_mode).css({color:'lightgray'});
		if (m_editor_dirty) {
			O.div().find('#update').html('Update*');
			O.div().find('#update').css({color:'black'});
		}
		else {
			O.div().find('#update').html('Update');
			O.div().find('#update').css({color:'lightgray'});	
		}

		O.div().find('#table').css({visibility:'hidden'});
		O.div().find('#script').css({visibility:'hidden'});
		O.div().find('#code').css({visibility:'hidden'});
		O.div().find('#tree').css({visibility:'hidden'});
		if (m_is_pipeline_script) {
			O.div().find('#script').css({visibility:'visible'});
		}
		else {
			O.div().find('#table').css({visibility:'visible'});
			O.div().find('#code').css({visibility:'visible'});
			O.div().find('#tree').css({visibility:'visible'});
		}
	}
}

