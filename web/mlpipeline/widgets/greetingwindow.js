function GreetingWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('GreetingWindow');

	refresh();
	function refresh() {
		O.div().empty();
		O.div().append('<h3><a href=# id=new>Create new document</a><h3>');
		O.div().append('<h3><a href=# id=file>Load from file</a><h3>');
		//O.div().append('<h3><a href=# id=gdrive>Load from Google Drive</a><h3>');
		O.div().append('<h3>Load from browser storage:</h3>');
		var ul=$('<ul/>');
		O.div().append(ul);
		var LS=new LocalStorage();
		var names=LS.allNames();
		for (var i in names) {
			var name=names[i];
			if (jsu_starts_with(name,'document--')) {
				var doc_name=name.slice(('document--').length);
				var E=create_local_storage_element(doc_name)
				var li=$('<li />');
				li.append(E);
				ul.append(li);
			}
		}
		O.div().find('#new').click(function() {
			O.emit('new_document');
		});
		O.div().find('#file').click(function() {
			O.emit('load_from_file');
		});
		//O.div().find('#gdrive').click(function() {
		//	O.emit('load_from_google_drive');
		//});
	}
	function create_local_storage_element(doc_name) {
		var ret=$('<a href=#>'+doc_name+'</a>');
		ret.click(function() {
			O.emit('load_from_browser_storage',{document_name:doc_name});
		});
		return ret;
	}

}