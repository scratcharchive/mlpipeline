#!/usr/bin/env nodejs
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
	'mlpipeline_main.js','mlpipeline.js',
	'kuleleclient.js','mlpdocument.js','docstorclient.js'
);
opts.STYLESHEETS.push('create.css');

opts.SOURCEPATH.push('widgets')
opts.SCRIPTS.push(
	'mltablewidget.js','editmlpipelinetablewidget.js','editmlpipelinewidget.js',
	'prvlistwidget.js','newstepdialog.js','editmlpipelinewidget.css',
	'mainwindow.js','mainmenu.js','statusbar.js','viewlistwidget.js',
	'googledrive.js','greetingwindow.js','editstepdialog.js','mlpipelinelistwidget.js',
	'importpipelinesdialog.js','textfilewindow.js','chooselogindlg.js',
	'recentfilewidget.js','mlplogwidget.js',
	'javascripteditor.js'
);

opts.SOURCEPATH.push('managers')
opts.SCRIPTS.push(
	'prvlistmanager.js','processormanager.js','mlpipelinelistmanager.js',
	'remotefilemanager.js','jobmanager.js'
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
