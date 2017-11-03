#!/usr/bin/env nodejs

//////////////////////////////////////////////////////////////////////
var opts={PROJECTPATH:__dirname, SOURCEPATH:['.'], SCRIPTS:[], STYLESHEETS:[]};

//////////////////////////////////////////////////////////////////////
//require('../../jsqcore/jsqcore.pri').load(opts);
opts.SOURCEPATH.push('jsq/src/jsqcore');
opts.SCRIPTS.push(
	'jquery.min.js','jsq.js','jsqobject.js','jsqwidget.js','jsqcanvaswidget.js','jquery-ui.min.js'
);
opts.STYLESHEETS.push(
	'jsq.css','jquery-ui.min.css'
);

//////////////////////////////////////////////////////////////////////
//require('jsq/jsqwidgets/jsqwidgets.pri').load(opts);
opts.SOURCEPATH.push('jsq/src/jsqwidgets')
opts.SCRIPTS.push(
	'jsqcanvaswidget.js','jsqtabwidget.js'
);

//////////////////////////////////////////////////////////////////////
opts.TARGET = 'index.html';
opts.SCRIPTS.push(
	'mlpipeline_main.js','mlpipeline.js','editmlpipelinewidget.js',
	'mltablewidget.js','kuleleclient.js','editmlpipelinetablewidget.js',
	'mlpdocument.js','jobmanager.js','docstorclient.js'
);
opts.STYLESHEETS.push('editmlpipelinewidget.css','create.css');

opts.SOURCEPATH.push('widgets')
opts.SCRIPTS.push(
	'prvlistwidget.js','newstepdialog.js',
	'mainwindow.js','mainmenu.js','statusbar.js','viewlistwidget.js',
	'googledrive.js','greetingwindow.js','editstepdialog.js','mlpipelinelistwidget.js',
	'importpipelinesdialog.js','textfilewindow.js'
);

opts.SOURCEPATH.push('managers')
opts.SCRIPTS.push(
	'prvlistmanager.js','processormanager.js','mlpipelinelistmanager.js'
);

opts.SOURCEPATH.push('jsutils')
opts.SCRIPTS.push(
	'jsutils.js','fileuploader.js','localstorage.js','url4text.js'
);

opts.SOURCEPATH.push('jsoneditor/dist')
opts.SCRIPTS.push(
	'jsoneditor.min.js'
);
opts.STYLESHEETS.push(
	'jsoneditor.min.css'
);

opts.SOURCEPATH.push('jsutils/3rdparty')
opts.SCRIPTS.push(
	'download.js','sha1.js'
);

// codemirror
opts.SCRIPTS.push('CodeMirror/lib/codemirror.js');
opts.STYLESHEETS.push('CodeMirror/lib/codemirror.css');

opts.SCRIPTS.push('CodeMirror/mode/javascript/javascript.js');

opts.SCRIPTS.push('jshint/jshint.js','CodeMirror/addon/lint/lint.js',
				  'CodeMirror/addon/lint/javascript-lint.js');
opts.STYLESHEETS.push('CodeMirror/addon/lint/lint.css');

//////////////////////////////////////////////////////////////////////
require(__dirname+'/jsq/jsqmake/jsqmake.js').jsqmake(opts);
