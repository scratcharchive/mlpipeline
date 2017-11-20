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
function StatusBar(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('StatusBar');

	this.setDocumentName=function(doc_name) {O.div().find('#document_name').html(doc_name);};
	this.refresh=function() {refresh();};
	this.setKuleleClient=function(X) {setKuleleClient(X);};
	this.setLastAction=function(action,timeout_msec) {setLastAction(action,timeout_msec);};
	this.setJobManager=function(JM) {setJobManager(JM);};

	O.div().append('<span class=status_box>Document: <span id=document_name></span></span>');
	O.div().append('&nbsp;');
	O.div().append('<span class=status_box>Processing server: <a href=# id=set_processing_server><span id=processing_server></span></a></span>');
	O.div().append('&nbsp;');
	O.div().append('<span class=status_box>Logged in as: <a href=# id=set_user_id><span id=user_id></span></a></span>');
	O.div().append('&nbsp;');
	O.div().append('<span class=status_box><span id=last_action></span></span>')
	O.div().append('<span class=status_box><span id=running_jobs></span></span>')

	O.div().find('#set_processing_server').click(function() {O.emit('set_processing_server');});
	O.div().find('#set_user_id').click(function() {O.emit('set_user_id');});
	JSQ.connect(O)

	var m_kuleke_client=null;
	var m_job_manager=null;

	function refresh() {
		if (!m_kuleke_client) {
			O.div().find('#processing_server').html('No kulele client set');
		}
		else {
			var processing_server=m_kuleke_client.subserverName();
			var processor_manager=m_kuleke_client.processorManager();
			var num_processors=processor_manager.numProcessors();
			if (m_kuleke_client.localMode()) {
				processing_server='[local]';
			}
			title0='Using processing server '+(processing_server||'[not set]')+' with '+num_processors+' registered processors';
			O.div().find('#processing_server').html('<span title="'+title0+'">'+(processing_server||'[not set]')+' ('+num_processors+')</span>');
			var userid=m_kuleke_client.userId();
			O.div().find('#user_id').html(userid||'');
			
		}
	}

	function setJobManager(JM) {
		m_job_manager=JM;
		JSQ.connect(JM,'job_status_changed',O,update_running_jobs);
	}
	function update_running_jobs() {
		if (!m_job_manager) return;
		var X=[];
		var num_pending=0;
		for (var i=0; i<m_job_manager.jobCount(); i++) {
			var J=m_job_manager.job(i);
			if (J.status()=='running') {
				X.push(J);
			}
			else if (J.status()=='pending') {
				num_pending++;
			}
		}
		var strlist=[];
		for (var i=0; i<X.length; i++) {
			strlist.push(X[i].processorName()||X[i].pipelineName()||'*');
		}
		var str0=strlist.join(', ');
		if (num_pending>0) str0+=' ('+num_pending+' pending)';
		O.div().find('#running_jobs').html(str0);
	}

	var m_action_code=0;
	function setLastAction(action,timeout_msec) {
		m_action_code++;
		var m_local_action_code=m_action_code;
		O.div().find('#last_action').html(action);
		refresh();
		if (timeout_msec) {
			setTimeout(function() {
				if (m_local_action_code!=m_action_code)
					return;
				O.div().find('#last_action').html('');
				refresh();
			},timeout_msec);
		}
	}

	function setKuleleClient(X) {
		m_kuleke_client=X;
		JSQ.connect(X,'changed',O,refresh);
		refresh();
	}

	refresh();


}