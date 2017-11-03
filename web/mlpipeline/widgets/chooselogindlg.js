function ChooseLoginDlg(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('ChooseLoginDlg');

	this.onAccepted=function(callback) {onAccepted(callback);};
	this.show=function() {show();};
	this.choice=function() {return m_choice;};

	var m_dialog=$('<div id="dialog"></div>');
	var m_label='Sign in to DocStor';
	var m_choice='';

	O.div().append('<h3>Sign in using one of the following methods:</h3>');
	var ul=$('<ul />');
	ul.append('<li><a href=# id=google>Google</a></li>');
	ul.append('<li><a href=# id=passcode>a passcode</a></li>');
	O.div().append(ul);
	O.div().append('<h3>Or <a href=# id=anonymous>proceed without logging in</a></h3>');

	O.div().find('#google').click(on_google);
	O.div().find('#passcode').click(on_passcode);
	O.div().find('#anonymous').click(on_anonymous);

	function show() {
		O.setSize(450,300);

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

	function on_google() {
		m_choice='google';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function on_passcode() {
		m_choice='passcode';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function on_anonymous() {
		m_choice='anonymous';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function onAccepted(callback) {
		JSQ.connect(O,'accepted',0,function(evt,args) {
			callback(args);
		});
	}
}