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