var express = require('express');
var app = express();

var larinetserver=require(__dirname+'/larinetserver.js');

var data_directory=larinetserver.handler_opts.data_directory;

if (!data_directory) {
	console.log ('problem: data_directory is empty (use a config file or the --data_directory=/path/to/prvbucket command-line argument.');
	return;
}

var Handler=new larinetserver.RequestHandler();

var CLP=new CLParams(process.argv);

var port=CLP.namedParameters['port']||(process.env.PORT || 5005);

app.set('port', port);

app.use(function(req,resp,next) {
	if (req.method == 'OPTIONS') {
		var headers = {};
		
		//allow cross-domain requests
		/// TODO refine this
		
		headers["Access-Control-Allow-Origin"] = "*";
		headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
		headers["Access-Control-Allow-Credentials"] = false;
		headers["Access-Control-Max-Age"] = '86400'; // 24 hours
		headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization";
		resp.writeHead(200, headers);
		resp.end();
		return;
	}

	var url_parts = require('url').parse(req.url,true);
	var host=url_parts.host;
	var path=url_parts.pathname;
	var query=url_parts.query;
	if (query.download_mode!='true') {
		Handler.handle_request(req,resp);
	}
	else {
		next();
	}
});
app.use(express.static(data_directory));

app.listen(app.get('port'), function() {
  console.log ('Node app is running on port', app.get('port'));
});

///////////////////////////////////////////////////////////////////////////////////////////////

function read_text_file(fname) {
	try {
		return require('fs').readFileSync(fname,'utf8');
	}
	catch(err) {
		console.log ('Problem reading text file: '+fname);
		return '';
	}
}

function read_json_file(fname) {
	var txt=read_text_file(fname);
	if (!txt) return null;
	try {
		return JSON.parse(txt);
	}
	catch(err) {
		console.log ('Error parsing json: '+txt);
		return null;
	}	
}

function CLParams(argv) {
	this.unnamedParameters=[];
	this.namedParameters={};

	var args=argv.slice(2);
	for (var i=0; i<args.length; i++) {
		var arg0=args[i];
		if (arg0.indexOf('--')===0) {
			arg0=arg0.slice(2);
			var ind=arg0.indexOf('=');
			if (ind>=0) {
				this.namedParameters[arg0.slice(0,ind)]=arg0.slice(ind+1);
			}
			else {
				//this.namedParameters[arg0]=args[i+1]||'';
				//i++;
				this.namedParameters[arg0]='';
			}
		}
		else if (arg0.indexOf('-')===0) {
			arg0=arg0.slice(1);
			this.namedParameters[arg0]='';
		}
		else {
			this.unnamedParameters.push(arg0);
		}
	}
};
