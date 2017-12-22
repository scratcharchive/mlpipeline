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
var using_nodejs=false;
if (typeof module !== 'undefined' && module.exports) {
	using_nodejs=true;

	JSQObject=require(__dirname+'/jsq/src/jsqcore/jsqobject.js').JSQObject;
	jsu=require(__dirname+'/jsutils/jsutils.js').jsu;

	jsu_starts_with=jsu.starts_with;
	jsu_ends_with=jsu.ends_with;

	exports.JobManager=JobManager;
	exports.Job=Job;
}
else {
}

function JobManager(O) {
	O=O||this;
	JSQObject(O);

	this.setDocument=function(doc) {m_document=doc;};
	this.setKuleleClient=function(KC) {m_kulele_client=KC;};
	this.setProcessorManager=function(PM) {m_processor_manager=PM;};
	this.document=function() {return m_document;};
	this.kuleleClient=function() {return m_kulele_client;};
	this.processorManager=function() {return m_processor_manager;};
	this.jobCount=function() {return m_jobs.length;};
	this.job=function(i) {return m_jobs[i];};
	this.clearJobs=function() {clearJobs();};
	this.findJobsForStep=function(parent_pipeline_name,step) {return findJobsForStep(parent_pipeline_name,step);};
	this.findLastJobForStep=function(parent_pipeline_name,step) {return findLastJobForStep(parent_pipeline_name,step);};
	this.startTopLevelJob=function(step,top_level_pipeline_name,on_complete) {startTopLevelJob(step,top_level_pipeline_name,on_complete);};
	this._addJob=function(job) {_addJob(job);};

	var m_document=null;
	var m_kulele_client=null;
	var m_processor_manager=null;
	var m_prv_list_manager=null;
	var m_jobs=[];

	function findJobsForStep(parent_pipeline_name,step) {
		var ret=[];
		for (var i=0; i<m_jobs.length; i++) {
			var job=m_jobs[i];
			if (job.parentPipelineName()==parent_pipeline_name) {
				var ok=true;
				if (job.jobType()!=step.step_type) ok=false;
				if ((job.processorName()||'')!=(step.processor_name||'')) ok=false;
				if ((job.pipelineName()||'')!=(step.pipeline_name||'')) ok=false;
				if (JSON.stringify(job.jsonOutputObject()||{})!=JSON.stringify(step.json_output_object||{})) ok=false;
				if (ok) {
					if (!matches0(job.inputFileNames(),step.inputs)) ok=false;
					if (!matches0(job.outputFileNames(),step.outputs)) ok=false;
					if (!matches0(job.unresolvedParameters(),step.parameters)) ok=false;
				}
				if (ok) {
					ret.push(job);
				}
			}
		}
		return ret;
	}
	function findLastJobForStep(parent_pipeline_name,step) {
		var list=findJobsForStep(parent_pipeline_name,step);
		if (list.length>0)
			return list[list.length-1];
		else return null;
	}
	function _addJob(job) {
		m_jobs.push(job);
		O.emit('job_added');
		JSQ.connect(job,'status_changed',O,function() {
			O.emit('job_status_changed');
		});
	}
	function clearJobs() {
		for (var i in m_jobs) {
			if ((m_jobs[i].status()=='running')||(m_jobs[i].status()=='pending'))
				m_jobs[i].stop();
		}
		m_jobs=[];
	}
	function startTopLevelJob(step,top_level_pipeline_name,on_complete) {
		var job=new Job();
		job.setJobType(step.step_type);
		job.setParentPipelineName(top_level_pipeline_name);
		if (step.step_type=='processor') {
			job.setProcessorName(step.processor_name);
		}
		else if (step.step_type=='pipeline') {
			job.setPipelineName(step.pipeline_name);
		}
		else if (step.step_type=='json_output') {
			job.setJsonOutputObject(step);
		}
		job.setInputFileNames(step.inputs);
		job.setOutputFileNames(step.outputs);
		job.setUnresolvedParameters(step.parameters);
		job._setStatus('pending');
		job.setJobManager(O);
		if (on_complete) job.onComplete(on_complete);

		handle_top_level_job(top_level_pipeline_name,job,step);
	}
	function handle_top_level_job(top_level_pipeline_name,job,step) {
		if (job.status()!='pending') {
			return;
		}
		var pipeline0=m_document.pipelineListManager().findPipeline(top_level_pipeline_name);
		if (!pipeline0) {
			job._setError('No pipeline found with name: '+top_level_pipeline_name);
			job._setStatus('error');
			return;
		}
		if (pipeline0.isPipelineScript()) {
			job._setError('Top-level pipeline cannot be script: '+top_level_pipeline_name);
			job._setStatus('error');
			return;	
		}
		var job0=O.findLastJobForStep(top_level_pipeline_name,step);
		if (!job0) {
			job._setError('Top-level job step no longer found in pipeline.');
			job._setStatus('error');
			return;
		}
		var input_file_names=job.inputFileNames();
		var input_files={};
		var parameters=JSQ.clone(step.parameters); //we don't resolve the parameters for top-level jobs (but we should do this in future)
		var ready_to_run=true;
		for (var ikey in input_file_names) {
			var name0=input_file_names[ikey];
			if (name0) {
				var tmp=m_document.inputFileManager().prvRecord(name0);
				if (tmp) {
					input_files[ikey]=tmp;
				}
				else {
					var step0=find_step_producing_file(pipeline0,name0);
					if (!step0) {
						job._setError('No step produces input file '+name0+' in pipeline '+top_level_pipeline_name);
						job._setStatus('error');
						return;
					}
					var job1=O.findLastJobForStep(top_level_pipeline_name,step0);
					if (job1) {
						if (job1.status()=='finished') {
							var found=false;
							var prvrec=null;
							for (var okey in step0.outputs) {
								if (step0.outputs[okey]==name0) {
									found=true;
									prvrec=job1.outputFiles()[okey];
								}
							}
							if (!found) {
								job._setError('Unexpected: output not found in step, even though we found the step with this property: '+name0);
								job._setStatus('error');
								return;
							}
							if (prvrec) {
								input_files[ikey]=prvrec;
							}
							else {
								ready_to_run=false;
							}
						}
						else if (job1.status()=='running') {
							ready_to_run=false;
						}
						else if (job1.status()=='pending') {
							ready_to_run=false;
						}
						else if (job1.status()=='error') {
							job._setError('Error has ocurred in job that would produce input: '+name0);
							job._setStatus('error');
							return;
						}
						else {
							job._setError('No job running or pending for input: '+name0);
							job._setStatus('error');
							return;	
						}
					}
				}
			}
		}
		if (ready_to_run) {
			job._setInputFiles(input_files);
			job._setParameters(parameters);
			job.start();
			return;
		}
		setTimeout(function() {
			handle_top_level_job(top_level_pipeline_name,job,step);
		},1000);
	}
	function find_step_producing_file(pipeline0,file_name) {
		for (var i=0; i<pipeline0.stepCount(); i++) {
			var step0=pipeline0.step(i);
			for (var okey in step0.outputs) {
				if (step0.outputs[okey]==file_name)
					return step0;
			}
		}
		return null;
	}
	function matches0(X,Y) {
		for (var key in X) {
			if (JSON.stringify(X[key])!=JSON.stringify(Y[key])) return false;
		}
		for (var key in Y) {
			if (JSON.stringify(X[key])!=JSON.stringify(Y[key])) return false;
		}
		return true;
	}
}

function Job(O) {
	O=O||this;
	JSQObject(O);

	this.setJobType=function(jt) {m_job_type=jt;};
	this.setProcessorName=function(pn) {m_processor_name=pn;};
	this.setPipelineName=function(pn) {m_pipeline_name=pn;};
	this.setJsonOutputObject=function(joo) {m_json_output_object=JSQ.clone(joo);};
	this.setInputFileNames=function(X) {m_input_file_names=JSQ.clone(X);};
	this.setOutputFileNames=function(X) {m_output_file_names=JSQ.clone(X);};
	this.setUnresolvedParameters=function(X) {m_unresolved_parameters=JSQ.clone(X);};
	this.setParentPipelineName=function(name) {m_parent_pipeline_name=name;};
	this.jobType=function() {return m_job_type;};
	this.processorName=function() {return m_processor_name;};
	this.pipelineName=function() {return m_pipeline_name;};
	this.jsonOutputObject=function() {return JSQ.clone(m_json_output_object);};
	this.inputFileNames=function() {return JSQ.clone(m_input_file_names);};
	this.outputFileNames=function() {return JSQ.clone(m_output_file_names);};
	this.unresolvedParameters=function() {return JSQ.clone(m_unresolved_parameters);};
	this.parentPipelineName=function() {return m_parent_pipeline_name;};
	this.inputFiles=function() {return JSQ.clone(m_input_files);};
	this.outputFiles=function() {return JSQ.clone(m_output_files);};
	this.status=function() {return m_status;};
	this.error=function() {return m_error;};
	this.parameters=function() {return JSQ.clone(m_parameters);};
	this.start=function() {start();};
	this.stop=function() {stop();};
	this.toObject=function() {return toObject();};
	this.fromObject=function(obj) {fromObject(obj);};
	this.getSpec=function() {return getSpec();};
	this.setJobManager=function(JM) {m_job_manager=JM; m_job_manager._addJob(O);};
	this.getLabel=function() {return getLabel();};
	this.onComplete=function(handler) {onComplete(handler);};
	this._setParameters=function(X) {m_parameters=JSQ.clone(X);};
	this._setInputFiles=function(X) {m_input_files=JSQ.clone(X);};
	this._setStatus=function(status) {_setStatus(status);};
	this._setError=function(error) {_setError(error);};

	var m_job_type=''; //processor or pipeline or json_output
	var m_processor_name=''; //if job_type=processor
	var m_pipeline_name=''; //if job_type=pipeline, the name of the MLPipeline or MLPipelineScript object
	var m_json_output_object={}; //if job_type=json_output, the object corresponding to the json_output, including the content to be resolved
	var m_input_file_names={};
	var m_output_file_names={};
	var m_unresolved_parameters={};
	var m_input_files={};
	var m_output_files={};
	var m_parameters={}; //the resolved parameters
	var m_status=''; //pending, running, finished, error
	var m_error=''; //if status=error, error string
	var m_job_manager=null; //important for execution
	var m_process_id='';
	var m_parent_pipeline_name='';

	function start() {
		if ((m_status!='')&&(m_status!='pending')) {
			report_error('Cannot start a job with status: '+m_status);
			return;
		}

		var spec=O.getSpec();
		if (!spec) {
			report_error('Unable to get spec for job: '+O.getLabel());
			return;
		}
		for (var iip in spec.parameters) {
			var pname=spec.parameters[iip].name||'';
			if ((!(pname in m_parameters))&&('default_value' in spec.parameters[iip]))
				m_parameters[pname]=spec.parameters[iip].default_value;
		}

		_setStatus('running');
		if (m_job_type=='processor') {
			var processor_spec=m_job_manager.processorManager().processorSpec(m_processor_name);
			if (!processor_spec) {
				report_error('No such processor found: '+m_processor_name);
				return;
			}
			setTimeout(start_processor,1);
		}
		else if (m_job_type=='pipeline') {
			var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(m_pipeline_name);
			if (!pipeline0) {
				report_error('No such pipeline found: '+m_pipeline_name);
				return;
			}
			setTimeout(start_pipeline,1);
		}
		else if (m_job_type=='json_output') {
			setTimeout(start_json_output,1);
		}
		else {
			report_error('Unsupported job type: '+m_job_type);
		}
	}
	function stop() {
		if (m_status=='pending') {
			report_error('Stopped');
			return;
		}
		if (m_status!='running') {
			console.log ('Warning: cannot stop a job that is not running.');
			return;
		}
		if (m_job_type=='processor') {
			stop_process();
		}
		else if (m_job_type=='pipeline') {
			stop_pipeline();
		}
		else {
			console.log ('Unexpected problem in stop() **');
			return;
		}
	}
	function toObject() {
		var ret={
			job_type:m_job_type,
			input_file_names:m_input_file_names,
			output_file_names:m_output_file_names,
			unresolved_parameters:m_unresolved_parameters,
			input_files:m_input_files,
			output_files:m_output_files,
			parameters:m_parameters,
			status:m_status,
			error:m_error,
			process_id:m_process_id
		};
		if (m_job_type=='processor') {
			ret.processor_name=m_processor_name;
		}
		else if (m_job_type='pipeline') {
			ret.pipeline_name=m_pipeline_name;
		}
		else if (m_job_type='json_output') {
			ret.json_output_object=m_json_output_object;
		}
		return JSQ.clone(ret);
	}
	function fromObject(obj_in) {
		var obj=JSQ.clone(obj_in);
		m_job_type=obj.job_type;
		m_input_file_names=obj.input_file_names;
		m_output_file_names=obj.output_file_names;
		m_unresolved_parameters=obj.unresolved_parameters;
		m_input_files=obj.input_files;
		m_output_files=obj.output_files;
		m_parameters=obj.parameters;
		m_status=obj.status;
		m_error=obj.error;
		m_process_id=obj.process_id;
		m_processor_name=obj.processor_name||'';
		m_pipeline_name=obj.pipeline_name||'';
		m_json_output_object=obj.json_output_object||{};
	}
	function getSpec() {
		if (m_job_type=='processor') {
			return m_job_manager.processorManager().processorSpec(m_processor_name);
		}
		else if (m_job_type=='pipeline') {
			var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(m_pipeline_name);
			if (!pipeline0) return null;
			return pipeline0.spec();
		}
		else if (m_job_type=="json_output") {
			var spec={inputs:[],outputs:[{name:'output'}],parameters:[]};
			var inputs=m_json_output_object.inputs||{};
			var outputs=m_json_output_object.outputs||{};
			var parameters=m_json_output_object.parameters||{};
			for (var iname in inputs) {
				spec.inputs.push({name:iname});
			}
			for (var pname in parameters) {
				spec.parameters.push({name:pname});
			}
			return spec;
		}
		else return null;
	}
	function getLabel() {
		var ret=m_job_type+': ';
		ret+=m_processor_name||m_pipeline_name||'';
		return ret;
	}
	function start_processor() {
		var spec=m_job_manager.processorManager().processorSpec(m_processor_name);

		var KC=m_job_manager.kuleleClient();
		var inputs={};
		for (var i in spec.inputs) {
			var spec_input=spec.inputs[i];
			if (m_input_files[spec_input.name]) {
				var tmp=m_input_files[spec_input.name];
				if (tmp.prv)
					inputs[spec_input.name]=tmp.prv;
				else {
					var tmp2=[];
					for (var i in tmp) tmp2.push(tmp[i].prv);
					inputs[spec_input.name]=tmp2;
				}
			}
			else {
				if (spec_input.optional!=true) {
					report_error('Missing required input: '+spec_input.name);
					return;
				}
			}
		}
		var outputs_to_return={};
		for (var i in spec.outputs) {
			var spec_output=spec.outputs[i];
			if (m_output_file_names[spec_output.name]) {
				outputs_to_return[spec_output.name]=true;
			}
			else {
				if (spec_output.optional!=true) {
					report_error('Missing required output: '+spec_output.name);
					return;
				}
			}
		}
		outputs_to_return.console_out=true;
		plog('----------------------------------------------------------------------------');
		plog('Queueing job: '+m_processor_name);
		{
			var inputs_str='INPUTS: ';
			for (var iname in inputs) {
				inputs_str+=iname+'='+inputs[iname]+'  ';
			}
			plog('  '+inputs_str);
		}
		{
			var params_str='PARAMS: ';
			for (var pname in m_parameters) {
				params_str+=pname+'='+m_parameters[pname]+'  ';
			}
			plog('  '+params_str);
		}
		plog('----------------------------------------------------------------------------');
		KC.queueJob(m_processor_name,inputs,outputs_to_return,m_parameters,{},function(resp) {
			if (!resp.success) {
				report_error(resp.error);
				return;
			}
			m_process_id=resp.process_id;
			handle_process_probe_response(resp);
		});
	}
	function plog(str,aa) {
		if (using_nodejs) {
			console.log(str);
		}
		else {
			console.log(str); //not sure if we should do this
			if (!aa) aa={};
			aa.text=str;
			mlpLog(aa);
		}
	}
	function handle_process_probe_response(resp) {
		if (!resp.success) {
			report_error(resp.error);
			return;
		}
		if (m_process_id!=resp.process_id) {
			report_error('Unexpected: process_id does not match response: '+m_process_id+'<>'+resp.process_id);
			return;
		}
		if (resp.latest_console_output) {
			var lines=resp.latest_console_output.split('\n');
			for (var i in lines) {
				if (lines[i].trim()) {
					var str0='  |'+m_processor_name+'| ';
					while (str0.length<35) str0+=' ';
					plog(str0+lines[i],{side:'server'});
				}
			}
		}
		if (resp.complete) {
			var err0='';
			if (!resp.result) {
				report_error('Unexpected: result not found in process response.');
				return;
			}
			var result=resp.result;
			if (!result.success) {
				if (!err0)
					err0=result.error||'Unknown error';
			}
			if (result.outputs) {
				for (var okey in m_output_file_names) {
					if (m_output_file_names[okey]) {
						if (!result.outputs[okey]) {
							if (!err0)
								err0='Output not found in process response: '+okey;
						}
						else {
							var prv0=result.outputs[okey];
							m_output_files[okey]={prv:prv0};
						}
					}
				}
				if (result.outputs['console_out']) {
					var prv0=result.outputs['console_out'];
					m_output_files['console_out']={prv:prv0};
				}
			}
			else {
				if (!err0)
					err0='Unexpected: result.outputs not found in process response';
			}
			if (err0) {
				report_error(err0);
				return;
			}
			_setStatus('finished');
		}
		else {
			setTimeout(send_process_probe,5000);
		}
	}
	function send_process_probe() {
		var KC=m_job_manager.kuleleClient();
		KC.probeJob(m_process_id,function(resp) {
			handle_process_probe_response(resp);
		});
	}
	function stop_process() {
		if (!m_process_id) {
			console.log ('Cannot cancel job. No process id has been assigned yet.');
			return;
		}
		var KC=m_job_manager.kuleleClient();
		KC.cancelJob(m_process_id,function(resp) {
			if (!resp.success) {
				console.log ('Warning: problem canceling job: '+resp.error);
			}
		});
	}
	function start_pipeline() {
		var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(m_pipeline_name);
		if (!pipeline0) {
			report_error('Unexpected: pipeline not found in do_run_pipeline: '+m_pipeline_name);
			return;
		}
		if (pipeline0.isPipelineScript()) {
			var pipeline1=pipeline0.pipeline(m_input_files,m_output_files,m_parameters);
			if (!pipeline1) {
				report_error('Error running pipeline script: '+pipeline0.error());
				return;
			}
			pipeline0=pipeline1;
		}
		
		/*
		var spec=pipeline0.spec();
		var FM=new PrvListManager(0,m_job_manager.kuleleClient());
		for (var i in spec.inputs) {
			var spec_input=spec.inputs[i];
			if (m_input_files[spec_input.name]) {
				FM.setPrvRecord(spec_input.name,m_input_files[spec_input.name]);
			}
			else {
				if (spec_input.optional!=true) {
					report_error('Missing required input ('+spec_input.name+') in pipeline: '+m_pipeline_name);
					return;
				} 
			}
		}
		*/

		var jobs=[];
		for (var j=0; j<pipeline0.stepCount(); j++) {
			var step0=pipeline0.step(j);
			var job0=new Job();
			job0.setParentPipelineName(m_pipeline_name);
			job0.setJobManager(m_job_manager);
			job0.setJobType(step0.step_type);
			job0.setInputFileNames(step0.inputs);
			job0.setOutputFileNames(step0.outputs);
			job0.setUnresolvedParameters(step0.parameters);
			if (step0.step_type=='processor') {
				job0.setProcessorName(step0.processor_name);
			}
			else if (step0.step_type=='pipeline') {
				job0.setPipelineName(step0.pipeline_name);
			}
			else if (step0.step_type=='json_output') {
				job0.setJsonOutputObject(step0);
			}

			job0._setStatus('pending');
			//job0.start(m_job_manager);
			jobs.push(job0);
		}
		_setStatus('running');
		setTimeout(check_jobs,100);
		function check_jobs() {
			if (O.status()!='running') {
				for (var j=0; j<jobs.length; j++) {
					if ((jobs[j].status()=='pending')||(jobs[j].status()=='running')) {
						jobs[j].stop();
					}
				}
				return;
			}
			var all_finished=true;
			for (var j=0; j<jobs.length; j++) {
				if (jobs[j].status()!='finished') {
					all_finished=false;
				}
				if (jobs[j].status()=='error') {
					_setError('Error in job ('+(jobs[j].getLabel())+'): '+jobs[j].error());
					_setStatus('error');
					//all other jobs will get stopped on the next call to check_jobs
					break;
				}
			}
			if (all_finished) {
				for (var okey in m_output_file_names) {
					if (m_output_file_names[okey]) {
						var prvrec=find_input_file(jobs,okey);
						if (!prvrec) {
							report_error('Unable to find output file ('+okey+') (*): '+m_output_file_names[okey]);
							return;
						}
						m_output_files[okey]=prvrec;
					}
				}
				O._setStatus('finished');
			}
			for (var j=0; j<jobs.length; j++) {
				var job0=jobs[j];
				if (job0.status()=='pending') {
					check_pending_job(job0);
				}
			}
			setTimeout(check_jobs,200);
		}
		function find_input_file(job_list,file_name) {
			for (var i=0; i<job_list.length; i++) {
				var job0=job_list[i];
				var output_file_names=job0.outputFileNames();
				for (var oname in output_file_names) {
					if (output_file_names[oname]==file_name) {
						if (job0.status()=='finished') {
							return job0.outputFiles()[oname];
						}
					}
				}
			}
			return null;
		}

		function input_file_is_pending(job_list,file_name) {
			for (var i=0; i<job_list.length; i++) {
				var job0=job_list[i];
				var output_file_names=job0.outputFileNames();
				for (var oname in output_file_names) {
					if (output_file_names[oname]==file_name) {
						if ((job0.status()=='finished')||(job0.status()=='running')||(job0.status()=='pending')) {
							return true;
						}
					}
				}
			}
			return false;
		}
		function check_pending_job(job0) {
			var input_file_names=job0.inputFileNames();
			var everything_ready=true
			var input_files={};
			for (var iname in input_file_names) {
				var list0=input_file_names[iname];
				if (typeof(list0)=='string') list0=[list0];
				var list1=[];

				for (var jj=0; jj<list0.length; jj++) {
					var prvrec=null;
					if (list0[jj] in m_input_files) {
						prvrec=m_input_files[list0[jj]];
					}
					if (!prvrec) {
						prvrec=find_input_file(jobs,list0[jj]);
					}
					if (!prvrec) {
						if (!input_file_is_pending(jobs,list0[jj])) {
							report_error('Could not find input in running or pending jobs: '+list0[jj]);
							return;
						}
					}
					if (prvrec) {
						list1.push(prvrec);
					}
					else everything_ready=false;
				}
				if (list1.length==1) list1=list1[0];
				input_files[iname]=list1;
			}
			if (!everything_ready) return;

			var unresolved_parameters=job0.unresolvedParameters();
			var parameters={};
			for (var pname in unresolved_parameters) {
				var pval=unresolved_parameters[pname];
				if ((jsu_starts_with(pval,'${'))&&(jsu_ends_with(pval,'}'))) {
					var pname2=pval.slice(2,pval.length-1);
					if (!(pname2 in m_parameters)) {
						report_error('Unable to find parameter in pipeline job: '+pname2);
						return;
					}
					var pval2=m_parameters[pname2];
					parameters[pname]=pval2;
				}
				else {
					parameters[pname]=pval;
				}
			}
			job0._setInputFiles(input_files);
			job0._setParameters(parameters);
			job0.start();
		}
	}
	function stop_pipeline() {
		_setError('stopped');
		_setStatus('error');
	}
	function start_json_output() {
		var content=JSQ.clone(m_json_output_object.content||{});
		if (!filter_json_output_content(content)) {
			//error has already been reported
			return;
		}
		
		var output_name=(m_json_output_object.outputs||{}).output;
		if (!output_name) {
			report_error('Missing required output: output');
			return;
		}
		m_output_files['output']={content:content};
		_setStatus('finished');
	}
	function _setStatus(status) {
		if (m_status==status) return;
		m_status=status;
		O.emit('status_changed');
	}
	function _setError(error) {
		if (m_error==error) return;
		if (m_error) return; //don't overwrite the error
		console.error(error);
		m_error=error;
		O.emit('status_changed');
	}

	function onComplete(handler) {
		JSQ.connect(O,'status_changed',O,function() {
			setTimeout(function() {
				if (m_status=='finished') {
					handler({success:true});
				}
				else if (m_status=='error') {
					handler({success:false,error:m_error});
				}
			},0);
		});
	}

	function report_error(error) {
		console.error(error);
		_setError(error);
		_setStatus('error');
	}
	function filter_json_output_content(content) {
		for (var key in content) {
			if (typeof content[key] == 'string') {
				var val=content[key];
				if ((jsu_starts_with(val,'${')&&(jsu_ends_with(val,'}')))) {
					var str=val.slice(2,val.length-1);
					if (str=='processing_server') {
						content[key]=m_job_manager.kuleleClient().subserverName();
					}
					else if (str in m_parameters) {
						content[key]=m_parameters[str];
					}
					else if (str in m_input_file_names) {
						if (str in m_input_files) {
							content[key]=m_input_files[str].content||m_input_files[str].prv;
						}
						else {
							report_error('Input file not found: '+str);
							return false;
						}
					}
					else {
						report_error('Unable to find input or parameter: '+str);
						return false;
					}
				}
			}
			else if (typeof content[key] == 'object') {
				if (!filter_json_output_content(content[key])) {
					return false;
				}
			}
		}
		return true;
	}

}

