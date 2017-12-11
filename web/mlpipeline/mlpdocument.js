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
if (typeof module !== 'undefined' && module.exports) {
	JSQObject=require(__dirname+'/jsq/src/jsqcore/jsqobject.js').JSQObject;
	MLPipelineListManager=require(__dirname+'/managers/mlpipelinelistmanager.js').MLPipelineListManager;
	PrvListManager=require(__dirname+'/managers/prvlistmanager.js').PrvListManager;
	MLPipeline=require(__dirname+'/mlpipeline.js').MLPipeline;
	MLPipelineScript=require(__dirname+'/mlpipeline.js').MLPipelineScript;

	exports.MLPDocument=MLPDocument;
}

function MLPDocument(O) {
	O=O||this;
	JSQObject(O);

	this.toObject=function() {return toObject();};
	this.fromObject=function(obj) {fromObject(obj);};
	this.documentName=function() {return m_document_name;};
	this.documentOwner=function() {return m_document_owner;};
	this.setDocumentName=function(name) {m_document_name=name;};
	this.setDocumentOwner=function(owner) {m_document_owner=owner;};
	this.pipelineListManager=function() {return m_pipeline_list_manager;};
	this.inputFileManager=function() {return m_input_file_manager;};
	this.outputFileManager=function() {return m_output_file_manager;};
	this.processingServerName=function() {return m_processing_server_name;};
	this.setProcessingServerName=function(name) {if (m_processing_server_name==name) return; m_processing_server_name=name; O.emit('processing_server_name_changed')};
	this.setJobManager=function(JM) {m_job_manager=JM;};

	var m_document_name='default';
	var m_document_owner='';
	var m_pipeline_list_manager=new MLPipelineListManager();
	var m_input_file_manager=new PrvListManager();
	var m_output_file_manager=new PrvListManager();
	var m_processing_server_name='';
	var m_job_manager=null;

	function toObject() {
		var obj={};
		obj.processing_server=m_processing_server_name||'';
		obj.pipelines=[];
		for (var i=0; i<m_pipeline_list_manager.pipelineCount(); i++) {
			obj.pipelines.push(m_pipeline_list_manager.pipeline(i).object());
		}
		obj.input_files=[];
		var input_file_names=m_input_file_manager.prvRecordNames();
		for (var i in input_file_names) {
			var rec=m_input_file_manager.prvRecord(input_file_names[i]);
			obj.input_files.push(rec);
		}
		obj.output_files=[];
		var output_file_names=m_output_file_manager.prvRecordNames();
		for (var i in output_file_names) {
			var rec=m_output_file_manager.prvRecord(output_file_names[i]);
			obj.output_files.push(rec);
		}
		obj.jobs=[];
		if (m_job_manager) {
			var test_pipeline=m_pipeline_list_manager.findPipeline('test')||m_pipeline_list_manager.findPipeline('main');
			if (test_pipeline) {
				for (var i=0; i<test_pipeline.stepCount(); i++) {
					var step0=test_pipeline.step(i);
					var job0=m_job_manager.findLastJobForStep(test_pipeline.name(),step0);
					if ((job0)&&(job0.status()=='finished')) {
						obj.jobs.push(job0.toObject());
					}
				}
			}
		}
		return obj;
	}
	function fromObject(obj) {
		var pipelines=obj.pipelines||[];
		m_pipeline_list_manager.clearPipelines();
		if (pipelines.length>0) {
			var pipeline_objects_by_name={};
			for (var i=0; i<pipelines.length; i++) {
				var spec0=pipelines[i].spec||{};
				var name0=spec0.name;
				if (name0) {
					pipeline_objects_by_name[name0]=pipelines[i];
				}
			}
			if (('main' in pipeline_objects_by_name)&&(!('test' in pipeline_objects_by_name))) {
				console.log ('Note: renaming subpipeline called "main" to "test".');
				pipeline_objects_by_name['main'].spec.name='test';
			}
			for (var i=0; i<pipelines.length; i++) {
				var P;
				if (pipelines[i].script) {
					P=new MLPipelineScript();
				}
				else {
					P=new MLPipeline();
				}
				P.setObject(pipelines[i]);
				m_pipeline_list_manager.addPipeline(P);
			}
		}
		else {
			var P=new MLPipeline();
			P.setObject({spec:{name:'test'}});
			m_pipeline_list_manager.addPipeline(P);
		}
		var input_files=obj.input_files||[];
		m_input_file_manager.clearPrvRecords();
		if (input_files.length>0) {
			for (var i=0; i<input_files.length; i++) {
				var prvrec=input_files[i];
				m_input_file_manager.setPrvRecord(prvrec.name,prvrec);
			}
		}
		var output_files=obj.output_files||[];
		m_output_file_manager.clearPrvRecords();
		if (output_files.length>0) {
			for (var i=0; i<output_files.length; i++) {
				var prvrec=output_files[i];
				m_output_file_manager.setPrvRecord(prvrec.name,prvrec);
			}
		}
		if ((m_job_manager)&&(obj.jobs)) {
			for (var i in obj.jobs) {
				var job_object=obj.jobs[i];
				var job=new Job();
				job.fromObject(job_object);
				m_job_manager._addJob(job);
			}
		}
		O.setProcessingServerName(obj.processing_server||'');
	}

}