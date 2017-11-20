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
function EditStepDialog(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('EditStepDialog');

	this.show=function() {show();};
	this.setSpec=function(spec) {m_spec=JSQ.clone(spec);};
	this.setStep=function(step) {m_step=JSQ.clone(step); update_controls();};
	this.step=function() {return JSQ.clone(m_step);};

	var m_label='Edit step';
	var m_step={};
	var m_spec={};
	var m_dialog=null;
	var m_processor_name_field=[];
	var m_input_fields=[];

	var m_json_editor_div=$('<div></div>');
	var m_json_editor=new JSONEditor(m_json_editor_div[0],{mode:'code'});

	var table=$('<table class=Table1></table>');
	/*
	table.append('<tr><th>Processor name</th><td><span id=processor_name /></td></tr>');
	table.append('<tr><th>Inputs</th><td id=inputs></td></tr>');
	table.append('<tr><th>Outputs</th><td id=outputs></td></tr>');
	table.append('<tr><th>Parameters</th><td id=parameters></td></tr>');
	*/

	var m_container_div=$('<div />');
	m_container_div.css({'overflow':'auto'});
	m_container_div.append(table);
	m_container_div.append(m_json_editor_div);

	O.div().append(m_container_div);

	O.div().append('<div id=buttons><button id=cancel_button>Cancel</button><button id=ok_button>OK</button></div>');
	O.div().find('#cancel_button').click(on_cancel);
	O.div().find('#ok_button').click(on_ok);
	O.div().find('#buttons').css({position:'absolute',bottom:0,left:0});

	//make_editable(O.div().find('#processor_name'));

	function show() {
		var H0=Math.max($(document).height()-100,400);
		O.setSize(600,H0);
		var W=O.width();
		var H=O.height();
		m_container_div.css({position:'absolute',left:20,top:20,width:W-40,height:H-30-40});
		m_json_editor_div.css({position:'absolute',left:0,top:0,width:m_container_div.width(),height:m_container_div.height()});
		m_dialog=$('<div id="dialog"></div>');
		
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});
	}

	function update_controls() {
		table.css({'visibility':'hidden'});
		m_json_editor_div.css({'visibility':'hidden'});
		m_json_editor.set(m_step);
		if ((m_step.step_type=='processor')||(m_step.step_type=='pipeline')||(m_step.step_type=='plugin')) {
			table.css({'visibility':'visible'});
			m_spec.inputs=m_spec.inputs||[];
			m_spec.outputs=m_spec.outputs||[];
			m_spec.parameters=m_spec.parameters||[];
			m_step.inputs=m_step.inputs||{};
			m_step.outputs=m_step.outputs||{};
			m_step.parameters=m_step.parameters||{};
			m_step.step_type=m_step.step_type||'processor';

			table.empty();
			if (m_step.step_type=='processor') {
				var tr0=$('<tr><th class=first_column>Processor name</th><td class=second_column><input class="edit_input" type="text" /></td></tr>')
				table.append(tr0);
				setup_field('processor_name',tr0.find('.edit_input'));
			}
			else if (m_step.step_type=='pipeline') {
				var tr0=$('<tr><th class=first_column>Pipeline name</th><td class=second_column><input class="edit_input" type="text" /></td></tr>')
				table.append(tr0);
				setup_field('pipeline_name',tr0.find('.edit_input'));	
			}

			table.append('<tr><td>&nbsp;</td><td /></tr>');
			table.append('<tr><th class=first_column>Inputs</th><th class=second_column></th></tr>');
			for (var i=0; i<m_spec.inputs.length; i++) {
				var input0=m_spec.inputs[i];
				var str0=input0.name;
				if (input0.optional) str0+=' (optional)';
				var tr0=$('<tr><td>'+str0+'</td><td><input class="edit_input" type="text" /></td></tr>');
				table.append(tr0);
				setup_input_field(input0.name,tr0.find('.edit_input'));
			}

			if (m_step.step_type!='plugin') {
				table.append('<tr><td>&nbsp;</td><td /></tr>');
				table.append('<tr><th class=first_column>Outputs</th><th class=second_column></th></tr>');
				for (var i=0; i<m_spec.outputs.length; i++) {
					var output0=m_spec.outputs[i];
					var str0=output0.name;
					if (output0.optional) str0+=' (optional)';
					var tr0=$('<tr><td>'+str0+'</td><td><input class="edit_input" type="text" /></td></tr>');
					table.append(tr0);
					setup_output_field(output0.name,tr0.find('.edit_input'));
				}
			}

			table.append('<tr><td>&nbsp;</td><td /></tr>');
			table.append('<tr><th class=first_column>Parameters</th><th class=second_column></th></tr>');
			for (var i=0; i<m_spec.parameters.length; i++) {
				var param0=m_spec.parameters[i];
				var str0=param0.name;
				if (param0.optional) str0+=' (optional)';
				var tr0=$('<tr><td>'+str0+'</td><td><input class="edit_input" type="text" /></td></tr>');
				table.append(tr0);
				setup_parameter_field(param0.name,tr0.find('.edit_input'));
			}

			table.find('.first_column').css({width:150});
			table.find('.second_column').css({width:400});
			table.find('input').css({width:380,height:17,padding:3,'font-size':'12px'});
			table.find('input').attr('spellcheck','false');
			table.find('td,th').css({border:'none',padding:0});
		}
		else if (m_step.step_type=='json_output') {
			m_json_editor_div.css({'visibility':'visible'});
		}

	}

	function setup_field(name,elmt) {
		elmt.val(m_step[name]||'');
		elmt.on('input',function() {
			m_step[name]=elmt.val();
		});
	}

	function setup_input_field(name,elmt) {
		elmt.val(from_string_or_list(m_step.inputs[name]||''));
		elmt.on('input',function() {
			m_step.inputs[name]=to_string_or_list(elmt.val());
		});
	}
	function setup_output_field(name,elmt) {
		elmt.val(from_string_or_list(m_step.outputs[name]||''));
		elmt.on('input',function() {
			m_step.outputs[name]=to_string_or_list(elmt.val());
		});
	}
	function setup_parameter_field(name,elmt) {
		elmt.val(m_step.parameters[name]||'');
		elmt.on('input',function() {
			m_step.parameters[name]=elmt.val();
		});
	}

	function to_string_or_list(str) {
		var list=str.split(',');
		var list2=[];
		for (var i=0; i<list.length; i++) {
			if (list[i].trim()) {
				list2.push(list[i].trim());
			}
		}
		if (list2.length===0) return '';
		else if (list2.length==1) return list2[0];
		else return list2;
	}
	function from_string_or_list(str_or_list) {
		if (typeof(str_or_list == 'string')) {
			return str_or_list;
		}
		else return str_or_list.join(',');
	}

	function on_cancel() {
		O.emit('rejected');
		m_dialog.dialog('close');

	}
	function on_ok() {
		if (m_step.step_type=='json_output') {
			m_step=m_json_editor.get();
		}
		O.emit('accepted');
		m_dialog.dialog('close');
	}
}