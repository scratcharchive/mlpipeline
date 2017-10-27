function MainMenu(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MainMenu');

	this.handleKeyPress=function(event,key) {handleKeyPress(event,key);};
	this.registerPlugin=function(info) {registerPlugin(info);};

	var m_menubar=$('<div id=cssmenu><ul class=top></ul></div>');
	O.div().append(m_menubar);
	O.div().css({'overflow':'visible'});

	var m_key_handlers=[];

	var file_menu=add_menu('File');
	add_menu_item(file_menu,'New document',function() {O.emit('new_document');});
	add_menu_item(file_menu,'Save to browser storage...',function() {O.emit('save_to_browser_storage');},'Ctrl+s');
	add_menu_item(file_menu,'Load from browser storage...',function() {O.emit('load_from_browser_storage');});
	add_menu_divider(file_menu);
	add_menu_item(file_menu,'Save to file...',function() {O.emit('save_to_file');});
	add_menu_item(file_menu,'Load from file...',function() {O.emit('load_from_file');});
	add_menu_divider(file_menu);
	add_menu_item(file_menu,'Save to processing server...',function() {O.emit('save_to_processing_server');});
	add_menu_item(file_menu,'Load from processing server...',function() {O.emit('load_from_processing_server');});
	add_menu_divider(file_menu);
	//add_menu_item(file_menu,'Save to Google Drive...',function() {O.emit('save_to_google_drive');});
	//add_menu_item(file_menu,'Load from Google Drive...',function() {O.emit('load_from_google_drive');});
	add_menu_divider(file_menu);
	add_menu_item(file_menu,'Get temporary shareable link...',function() {O.emit('get_temporary_shareable_link');});

	var import_menu=add_menu('Pipelines');
	add_menu_item(import_menu,'Import pipelines from repo...',function() {O.emit('import_pipelines_from_repo');},'Ctrl+i');

	var login_menu=add_menu('Log in');
	add_menu_item(login_menu,'Use Google account...',function() {O.emit('login_using_google');});
	add_menu_item(login_menu,'Use passcode...',function() {O.emit('login_using_passcode');});

	var server_menu=add_menu('Configuration');
	add_menu_item(server_menu,'Set processing server...',function() {O.emit('select_processing_server');});
	add_menu_item(server_menu,'Advanced...',function() {O.emit('advanced_configuration');});

	var plugin_menu=add_menu('Plugins');

	//m_menubar.menu();
	$('#cssmenu').prepend('<div id="menu-button">Menu</div>');
	$('#cssmenu #menu-button').on('click', function(){
		var menu = $(this).next('ul');
		if (menu.hasClass('open')) {
			menu.removeClass('open');
		}
		else {
			menu.addClass('open');
		}
	});

	function matches_key_handler(H,event) {
		if (H.ctrlKey!=event.ctrlKey) return false;
		if (H.key.toLowerCase()!=event.key.toLowerCase()) return false;
		return true;
	}
	JSQ.addPreventDefaultKeyPressHandler(function(e) {
		for (var i in m_key_handlers) {
			var H=m_key_handlers[i];
			if (matches_key_handler(H,event)) {
				return true;
			}
		}
		return false;
	});
	function handleKeyPress(event) {
		for (var i in m_key_handlers) {
			var H=m_key_handlers[i];
			if (matches_key_handler(H,event)) {
				H.callback();
			}
		}
	}

	function add_menu(label) {
		var menu0=$('<li class="active has-sub"><a href="#">'+label+'</a><ul class=content></ul></li>');
		m_menubar.find('.top').append(menu0);
		return menu0;
	}
	function add_menu_item(parent,label,handler,shortcut_string) {
		var txt=label;
		if (shortcut_string) txt+=' ('+shortcut_string+')';
		var X=$('<li><a href="#">'+txt+'</a></li>')
		X.find('a').click(function() {
			setTimeout(handler,0)
		});
		parent.find('.content').append(X);
		if (shortcut_string) {
			var list=shortcut_string.split('+');
			var H={};
			H.ctrlKey=(list[0].toLowerCase()=='ctrl');
			H.key=list[1];
			H.callback=handler;
			m_key_handlers.push(H);
		}
	}
	function add_menu_divider(parent) {
		//parent.find('.content').append(X);
	}
	function registerPlugin(info,action_callback) {
		var actions=info.actions||[];
		for (var i=0; i<actions.length; i++) {
			var aa=actions[i];
			add_menu_item(plugin_menu,aa.label,aa.callback);
		}
	}
}
