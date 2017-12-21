function JavaScriptEditor(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('JavaScriptEditor');

	this.setScript=function(script) {m_script_editor.setValue(script);};
	this.script=function() {return m_script_editor.getValue();};
	this.onSaved=function(handler) {JSQ.connect(m_button_widget,'save',O,handler);};
	this.onCanceled=function(handler) {JSQ.connect(m_button_widget,'cancel',O,handler);};

	var m_script_editor_div=$('<div><textarea /></div>');
	var m_script_editor=CodeMirror.fromTextArea(
		m_script_editor_div.
		find('textarea')[0], 
		{
	    	lineNumbers: true,
	    	mode: "javascript",
	    	lint:true,
	    	gutters: ["CodeMirror-lint-markers"]
  		});
  	m_script_editor.on('change',on_script_editor_changed);
  	var m_button_widget=new JavaScriptEditorButtonWidget();
  	O.div().append(m_script_editor_div);
  	m_button_widget.setParent(O);


  	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var button_height=50;

		m_script_editor_div.css({left:0,top:20+button_height,width:W,height:H-40-button_height,position:'absolute'});
		m_script_editor.setSize(W,H-40);
		m_script_editor.refresh();

		m_button_widget.setGeometry(0,20,W,button_height);
	}

  	function on_script_editor_changed() {

  	}

  	update_layout();
}

function JavaScriptEditorButtonWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('JavaScriptEditorButtonWidget');

	O.div().html('<span><button id=save_button>Save</button> <button id=cancel_button>Cancel</button></span>')
	O.div().find('#save_button').click(function() {
		O.emit('save');
	});
	O.div().find('#cancel_button').click(function() {
		O.emit('cancel');
	});
}