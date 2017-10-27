function SelectProcessorDialog(O,processor_manager,document) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('SelectProcessorDialog');

	this.show=function() {show();};
	this.processorName=function() {return m_processor_name;};

	var m_label='Select processor';
	var m_dialog=null;
	var m_processor_name='';

	var table=$('<table class=Table1></table>');
	var tr=$('<tr><th><span id=select></span></th></tr>');
	table.append(tr);
	O.div().append(table);
	var m_select=$('<select></select>');
	O.div().find('#select').append(m_select);

	O.div().append('<div id=buttons><button id=cancel_button>Cancel</button><button id=ok_button>OK</button></div>');
	O.div().find('#cancel_button').click(on_cancel);
	O.div().find('#ok_button').click(on_ok);
	O.div().find('#buttons').css({position:'absolute',bottom:0,left:0});

	function show() {
		m_select.empty();
		m_select.append('<option value="">(Select processor)</option>');
		var names=processor_manager.processorNames();
		if (document) {
			var PLM=document.pipelineListManager();
			for (var i=0; i<PLM.pipelineCount(); i++) {
				var pipeline0=PLM.pipeline(i);
				names.push(pipeline0.name());
			}
		}
		names.sort();
		for (var i in names) {
			var processor_name=names[i];
			m_select.append('<option value="'+processor_name+'">'+processor_name+'</option>');
		}
		O.setSize(450,300);
		m_dialog=$('<div id="dialog"></div>');
		var W=O.width();
		var H=O.height();
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});
	}

	function on_cancel() {
		O.emit('rejected');
		m_dialog.dialog('close');

	}
	function on_ok() {
		m_processor_name=m_select.val();
		O.emit('accepted');
		m_dialog.dialog('close');
	}

}