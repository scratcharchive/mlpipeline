var fs=require('fs');

function jsqmake(opts) {
	var html_text=read_text_file(__dirname+'/jsqmake.template.html');
	if (!html_text) {
		console.error('Unable to read jsqmake.template.html');
		return false;
	}
	var include_text=get_include_text(opts);
	if (!include_text) {
		console.error('Unable to get include text');
		return false;
	}
	html_text=strreplace(html_text,'$INCLUDES$',include_text);
	var target_path=opts.PROJECTPATH+'/'+opts.TARGET;
	if (!write_text_file(target_path,html_text)) {
		console.error('Unable to write target: '+target_path);
		return false;
	}
	console.log ('Wrote target: '+target_path);
	return true;

	function get_include_text(opts) {
		var ret='';
		for (var i=0; i<opts.SCRIPTS.length; i++) {
			var src_fname=find_source_file_path_rel_to_target(opts,opts.SCRIPTS[i]);
			if (!src_fname) {
				console.error('Unable to find source file: '+opts.SCRIPTS[i]);
				return '';
			}
			var line='<script src="$1$"></script>';
			line=strreplace(line,'$1$',src_fname);
			ret+=line+'\n';
		}
		for (var i=0; i<opts.STYLESHEETS.length; i++) {
			var src_fname=find_source_file_path_rel_to_target(opts,opts.STYLESHEETS[i]);
			if (!src_fname) {
				console.error('Unable to find source file: '+opts.STYLESHEETS[i]);
				return '';
			}
			var line='<link rel="stylesheet" type="text/css" href="$1$">';
			line=strreplace(line,'$1$',src_fname);
			ret+=line+'\n';
		}
		return ret;
	}
	function find_source_file_path_rel_to_target(opts,source_fname) {
		for (var i=0; i<opts.SOURCEPATH.length; i++) {
			var path=opts.PROJECTPATH+'/'+opts.SOURCEPATH[i]+'/'+source_fname;
			if (fs.existsSync(path)) return opts.SOURCEPATH[i]+'/'+source_fname;
		}
		return '';
	}
	function read_text_file(fname) {
		try {
			var txt=fs.readFileSync(fname,'utf8');
			return txt;
		}
		catch(e) {
			console.error('Problem reading file: '+fname);
			return '';
		}
	}
	function write_text_file(fname,txt) {
		try {
			fs.writeFileSync(fname,txt,'utf8');
			return true;
		}
		catch(e) {
			console.error('Problem writing file: '+fname);
			return false;
		}	
	}
	function strreplace(str,substr,repl) {
		return str.split(substr).join(repl);
	}
}

module.exports.jsqmake = jsqmake;