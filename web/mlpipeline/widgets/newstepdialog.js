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
function NewStepDialog(O,processor_manager,document) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('NewStepDialog');

	this.show=function() {show();};
	this.step=function() {return m_step;};

	var m_label='Create new step';
	var m_dialog=null;
	var m_step={};
	var m_table_div=$('<div />');

	var table=$('<table></table>');
	var tr1=$('<tr><td><input type=radio id=processor_radio name=choice checked=checked></input> Add processor step:</td><td><select id=processor_select></select></td></tr>');
	table.append(tr1);

	table.append('<tr><td>&nbsp;</td></tr>');
	var tr2=$('<tr><td><input type=radio id=pipeline_radio name=choice></input> Add pipeline step:</td><td><select id=pipeline_select></select></td></tr>');
	table.append(tr2);

	table.append('<tr><td>&nbsp;</td></tr>');
	var tr3=$('<tr><td><input type=radio id=json_output_radio name=choice></input> Add JSON output step</td><td></td></tr>');
	table.append(tr3);

	table.append('<tr><td>&nbsp;</td></tr>');

	m_table_div.append(table);

	O.div().append(m_table_div);

	var m_processor_select=O.div().find('#processor_select');
	var m_pipeline_select=O.div().find('#pipeline_select');

	O.div().append('<div id=buttons><button id=cancel_button>Cancel</button><button id=ok_button>OK</button></div>');
	O.div().find('#cancel_button').click(on_cancel);
	O.div().find('#ok_button').click(on_ok);
	O.div().find('#buttons').css({position:'absolute',bottom:0,left:0});

	function show() {

		m_processor_select.empty();
		m_processor_select.append('<option value="">(Select processor)</option>');
		var names=processor_manager.processorNames();
		names.sort();
		for (var i in names) {
			var processor_name=names[i];
			m_processor_select.append('<option value="'+processor_name+'">'+processor_name+'</option>');
		}

		var names2=[];
		if (document) {
			var PLM=document.pipelineListManager();
			for (var i=0; i<PLM.pipelineCount(); i++) {
				var pipeline0=PLM.pipeline(i);
				names2.push(pipeline0.name());
			}
		}
		m_pipeline_select.append('<option value="">(Select pipeline)</option>');
		for (var i in names2) {
			var pipeline_name=names2[i];
			m_pipeline_select.append('<option value="'+pipeline_name+'">'+pipeline_name+'</option>');
		}

		O.setSize(600,400);
		var W=O.width();
		var H=O.height();
		m_table_div.css({position:'absolute',left:20,top:20,width:W-40,height:H-40,overflow:'auto'});
		m_dialog=$('<div id="dialog"></div>');
		
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});

		m_processor_select.on('change',function() {
			O.div().find('#processor_radio').prop('checked','checked');
		});
		m_pipeline_select.on('change',function() {
			O.div().find('#pipeline_radio').prop('checked','checked');
		});
	}

	function on_cancel() {
		O.emit('rejected');
		m_dialog.dialog('close');

	}
	function on_ok() {
		if (O.div().find('#processor_radio').is(':checked')) {
			m_step={step_type:'processor',processor_name:O.div().find('#processor_select').val()};
		}
		else if (O.div().find('#pipeline_radio').is(':checked')) {
			m_step={step_type:'pipeline',pipeline_name:O.div().find('#pipeline_select').val()};
		}
		else if (O.div().find('#json_output_radio').is(':checked')) {
			m_step={step_type:'json_output'};
		}
		//m_processor_name=m_processor_select.val();
		O.emit('accepted');
		m_dialog.dialog('close');
	}

}