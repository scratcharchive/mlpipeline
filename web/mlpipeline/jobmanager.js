if (typeof module !== 'undefined' && module.exports) {

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
	this.startJobFromStep=function(step,parent_pipeline_name,callback) {startJobFromStep(step,parent_pipeline_name,callback);};
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
				if (JSON.stringify(step)==JSON.stringify(job.step())) {
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
	function startJobFromStep(step,parent_pipeline_name,callback) {
		var job=new Job();
		job.setJobManager(O);
		job.setStep(step);
		job.setParentPipelineName(parent_pipeline_name);
		job._setStatus('pending');
		var spec=job.getSpec();
		if (!spec) {
			job._setStatus('error');
			job._setError('Unable to get spec for job.');
			return;
		}
		wait_for_ready_to_run_and_set_up_job(job,function() {
			job.start(O);
			if (callback) callback();
		});
	}
	function wait_for_ready_to_run_and_set_up_job(job,callback) {
		var spec=job.getSpec();
		var step=job.step();
		var input_files={};
		var input_file_manager=m_document.inputFileManager();
		for (var i in spec.inputs) {
			var input0=spec.inputs[i];
			if (step.inputs[input0.name]) {
				var step_input_list=step.inputs[input0.name];
				var input_file_list=[];
				if (typeof(step_input_list)=='string') step_input_list=[step_input_list];
				for (var jj in step_input_list) {
					var step_input=step_input_list[jj];
					var prvrec=null;
					if (input_file_manager)
						prvrec=input_file_manager.prvRecord(step_input);
					if (!prvrec) {
						prvrec=find_input_file(job.parentPipelineName(),step_input);
					}
					if (prvrec) {
						input_file_list.push(prvrec);
					}
					else {
						if (input_file_is_pending(job.parentPipelineName(),step_input)) {
							setTimeout(function() {
								wait_for_ready_to_run_and_set_up_job(job,callback)
							},100);
							return;
						}
						else {
							job._setStatus('error');
							job._setError('Unable to find required input: '+step_input);
							return;
						}
					}
				}
				if (input_file_list.length==1) input_file_list=input_file_list[0];
				input_files[input0.name]=input_file_list;
			}
		}
		var parameters={};
		for (var i in spec.parameters) {
			var param0=spec.parameters[i];
			if (param0.name in step.parameters) {
				parameters[param0.name]=step.parameters[param0.name];
			}
			else {
				if (param0.optional) {
					parameters[param0.name]=param0.default_value;
				}
				else {
					job._setStatus('error');
					job._setError('Unable to find required parameter: '+param0.name);
					return;	
				}
			}
		}
		job._setInputFiles(input_files);
		job._setParameters(parameters);
		callback();
	}
	function find_input_file(pipeline_name,file_name) {
		var pipeline0=m_document.pipelineListManager().findPipeline(pipeline_name);
		if (!pipeline0) return null;
		if (!pipeline0.isPipelineScript()) {
			for (var i=0; i<pipeline0.stepCount(); i++) {
				var step0=pipeline0.step(i);
				for (var oname in step0.outputs) {
					if (step0.outputs[oname]==file_name) {
						var job=O.findLastJobForStep(pipeline_name,step0);
						if (!job) return null;
						if (job.status()=='finished') {
							return job.outputFiles()[oname];
						}
					}
				}
			}
		}
		return null;
	}
	function input_file_is_pending(pipeline_name,file_name) {
		var pipeline0=m_document.pipelineListManager().findPipeline(pipeline_name);
		if (!pipeline0) return false;
		if (!pipeline0.isPipelineScript()) {
			for (var i=0; i<pipeline0.stepCount(); i++) {
				var step0=pipeline0.step(i);
				for (var oname in step0.outputs) {
					if (step0.outputs[oname]==file_name) {
						var job=O.findLastJobForStep(pipeline_name,step0);
						if ((job.status()=='finished')||(job.status()=='running')||(job.status()=='pending')) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}
}

function Job(O) {
	O=O||this;
	JSQObject(O);

	this.step=function() {return JSQ.clone(m_step);};
	this.inputFiles=function() {return JSQ.clone(m_input_files);};
	this.outputFiles=function() {return JSQ.clone(m_output_files);};
	this.parentPipelineName=function() {return m_parent_pipeline_name;};
	this.status=function() {return m_status;};
	this.error=function() {return m_error;};
	this.setStep=function(step) {m_step=JSQ.clone(step);};
	this.parameters=function() {return JSQ.clone(m_parameters);};
	this.setParentPipelineName=function(name) {m_parent_pipeline_name=name;};
	this.start=function() {start();};
	this.stop=function() {stop();};
	this.toObject=function() {return toObject();};
	this.fromObject=function(obj) {fromObject(obj);};
	this.getSpec=function() {return getSpec();};
	this.setJobManager=function(JM) {m_job_manager=JM; m_job_manager._addJob(O);};
	this.getLabel=function() {return getLabel();};
	this._setStatus=function(status) {_setStatus(status);};
	this._setError=function(error) {_setError(error);};
	this._setInputFiles=function(input_files) {m_input_files=JSQ.clone(input_files);};
	this._setParameters=function(pp) {m_parameters=JSQ.clone(pp);};
	
	var m_step={};
	var m_input_files={};
	var m_output_files={};
	var m_parent_pipeline_name='';
	var m_status='';
	var m_error='';
	var m_job_manager=null;
	var m_process_id='';
	var m_parameters={};

	function toObject() {
		return {
			parent_pipeline_name:m_parent_pipeline_name,
			step:m_step,
			input_files:m_input_files,
			output_files:m_output_files,
			parameters:m_parameters,
			status:m_status,
			error:m_error,
			process_id:m_process_id
		};
	}
	function fromObject(obj) {
		O.setParentPipelineName(obj.parent_pipeline_name||'');
		O.setStep(obj.step||{});
		m_input_files=obj.input_files||{};
		m_output_files=obj.output_files||{};
		m_parameters=obj.parameters||{};
		m_status=obj.status||'';
		m_error=obj.error||'';
		m_process_id=obj.process_id||'';
	}
	function getSpec() {
		var step=m_step;
		if (step.step_type=='processor') {
			return m_job_manager.processorManager().processorSpec(step.processor_name);
		}
		else if (step.step_type=='pipeline') {
			var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(step.pipeline_name);
			if (!pipeline0) return null;
			return pipeline0.spec();
		}
		else if (step.step_type=="json_output") {
			var spec={inputs:[],outputs:[{name:'output'}],parameters:[]};
			for (var iname in step.inputs) {
				spec.inputs.push({name:iname});
			}
			for (var oname in step.outputs) {
				spec.outputs.push({name:oname});
			}
			for (var pname in step.parameters) {
				spec.parameters.push({name:pname});
			}
			return spec;
		}
		else return null;
	}
	function _setStatus(status) {
		if (m_status==status) return;
		m_status=status;
		O.emit('status_changed');
	}
	function _setError(error) {
		if (m_error==error) return;
		if (m_error) return; //don't overwrite the error
		m_error=error;
		O.emit('status_changed');
	}
	function report_error(error) {
		_setStatus('error');
		_setError(error);
	}
	function start() {
		if ((m_status!='')&&(m_status!='pending')) {
			report_error('Cannot start a job with status: '+m_status);
			return;
		}
		_setStatus('running');
		m_step.step_type=m_step.step_type||'processor';
		if (m_step.step_type=='processor') {
			var processor_spec=m_job_manager.processorManager().processorSpec(m_step.processor_name);
			if (!processor_spec) {
				report_error('No such processor found: '+m_step.processor_name);
				return;
			}
			setTimeout(start_processor,1);
		}
		else if (m_step.step_type=='pipeline') {
			var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(m_step.pipeline_name);
			if (!pipeline0) {
				report_error('No such pipeline found: '+m_step.pipeline_name);
				return;
			}
			setTimeout(start_pipeline,1);
		}
		else if (m_step.step_type=='json_output') {
			setTimeout(start_json_output,1);
		}
		else {
			report_error('Unsupported step type: '+m_step.step_type);
		}
	}
	/*
	function get_input_file(parent_pipeline,name) {
		for (var ss=0; (ss<parent_pipeline.stepCount())&&(!prvrec); ss++) {
			var step0=parent_pipeline.step(ss);
			for (var okey in step0.outputs) {
				if (step0.outputs[okey]==name) {
					var job0=m_job_manager.findLastJobForStep(parent_pipeline.name(),step0);
					if (job0) {
						if (job0.status()=='finished') {
							var output_files=job0.outputFiles();
							if (!output_files[okey]) {
								console.log ('Unexpected: output file not present in finished job: '+okey);
								return null;
							}
							return output_files[okey];
						}
						else if ((job0.status()=='pending')||(job0.status()=='running')) {
							return {message:'waiting_for_other_jobs'};
						}
						else {
							console.log ('Input not found (*): '+name);
							return null;				
						}
					}
				}
			}
		}
		return null;
	}
	*/
	function start_processor() {
		var spec=m_job_manager.processorManager().processorSpec(m_step.processor_name);

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
			if (m_step.outputs[spec_output.name]) {
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
		KC.queueJob(m_step.processor_name,inputs,outputs_to_return,m_parameters,{},function(resp) {
			if (!resp.success) {
				report_error(resp.error);
				return;
			}
			m_process_id=resp.process_id;
			handle_process_probe_response(resp);
		});
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
				for (var okey in m_step.outputs) {
					if (m_step.outputs[okey]) {
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
	function stop() {
		if (m_status=='pending') {
			report_error('Stopped');
			return;
		}
		if (m_status!='running') {
			console.log ('Warning: cannot stop a job that is not running.');
			return;
		}
		if (m_step.step_type=='processor') {
			stop_process();
		}
		else if (m_step.step_type=='pipeline') {
			stop_pipeline();
		}
		else {
			console.log ('Unexpected problem in stop() **');
			return;
		}
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
		var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(m_step.pipeline_name);
		if (!pipeline0) {
			report_error('Unexpected: pipeline not found in do_run_pipeline: '+m_step.pipeline_name);
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
		
		var spec=pipeline0.spec();
		var FM=new PrvListManager(0,m_job_manager.kuleleClient());
		for (var i in spec.inputs) {
			var spec_input=spec.inputs[i];
			if (m_input_files[spec_input.name]) {
				FM.setPrvRecord(spec_input.name,m_input_files[spec_input.name]);
			}
			else {
				if (spec_input.optional!=true) {
					report_error('Missing required input ('+spec_input.name+') in pipeline: '+m_step.pipeline_name);
					return;
				} 
			}
		}
		var jobs=[];
		for (var j=0; j<pipeline0.stepCount(); j++) {
			var step0=pipeline0.step(j);
			var job0=new Job();
			job0.setJobManager(m_job_manager);
			job0.setParentPipelineName(m_step.pipeline_name);
			job0.setStep(step0);
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
					_setStatus('error');
					_setError('Error in job ('+(jobs[j].step().processor_name||jobs[j].step().pipeline_name)+'): '+jobs[j].error());
					//all other jobs will get stopped on the next call to check_jobs
					break;
				}
			}
			if (all_finished) {
				for (var okey in m_step.outputs) {
					if (m_step.outputs[okey]) {
						var prvrec=find_input_file(jobs,okey);
						if (!prvrec) {
							report_error('Unable to find output file ('+okey+') (*): '+m_step.outputs[okey]);
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
				var step0=job0.step();
				for (var oname in step0.outputs) {
					if (step0.outputs[oname]==file_name) {
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
				var step0=job0.step();
				for (var oname in step0.outputs) {
					if (step0.outputs[oname]==file_name) {
						if ((job0.status()=='finished')||(job0.status()=='running')||(job0.status()=='pending')) {
							return true;
						}
					}
				}
			}
			return false;
		}
		function check_pending_job(job0) {
			var step0=job0.step();
			var everything_ready=true
			var input_files={};
			for (var iname in step0.inputs) {
				var list0=step0.inputs[iname].split(',');
				var list1=[];
				for (var jj=0; jj<list0.length; jj++) {
					var prvrec=null;
					if (list0[jj] in m_input_files) {
						prvrec=m_input_files[list0[jj]];
						console.log('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBa');
						console.log(JSON.stringify(prvrec));
					}
					if (!prvrec) {
						prvrec=find_input_file(jobs,list0[jj]);
						console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAa');
						console.log(JSON.stringify(prvrec));
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
				console.log('=============================================++++++++++++++++++++++');
				console.log(JSON.stringify(list1));
				if (list1.length==1) list1=list1[0];
				console.log('=============================================');
				console.log(JSON.stringify(list1));
				input_files[iname]=list1;
			}
			if (!everything_ready) return;

			var parameters=JSQ.clone(step0.parameters);
			for (var pname in parameters) {
				var pval=parameters[pname];
				if ((jsu_starts_with(pval,'${'))&&(jsu_ends_with(pval,'}'))) {
					var pname2=pval.slice(2,pval.length-1);
					if (!(pname2 in m_parameters)) {
						report_error('Unable to find parameter in pipeline job: '+pname2);
						return;
					}
					var pval2=m_parameters[pname2];
					parameters[pname]=pval2;
				}
			}
			var spec0=job0.getSpec();
			if (!spec0) {
				report_error('Unable to get spec for job: '+job0.getLabel());
				return;
			}
			for (var iip in spec0.parameters) {
				var pname=spec0.parameters[iip].name||'';
				if ((!(pname in parameters))&&('default_value' in spec0.parameters[iip]))
					parameters[pname]=spec0.parameters[iip].default_value;
			}
			console.log('input_files::::::::::::::::');
			console.log(JSON.stringify(input_files));
			job0._setInputFiles(input_files);
			job0._setParameters(parameters);
			job0.start();
		}
	}
	function filter_json_output_content(content) {
		for (var key in content) {
			if (typeof content[key] == 'string') {
				var val=content[key];
				if ((jsu_starts_with(val,'${')&&(jsu_ends_with(val,'}')))) {
					var str=val.slice(2,val.length-1);
					console.log('filter_json_output_content: '+str);
					if (str=='processing_server') {
						content[key]=m_job_manager.kuleleClient().subserverName();
					}
					else if (str in m_parameters) {
						console.log('param!');
						content[key]=m_parameters[str];
					}
					else if (str in m_step.inputs) {
						console.log('input!');
						if (str in m_input_files) {
							content[key]=m_input_files[str].content||m_input_files[str].prv;
						}
						else {
							report_error('Input file not found: '+str);
							return false;
						}
					}
					else {
						console.log('else!');
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
	function start_json_output() {
		var content=JSQ.clone(m_step.content||{});
		if (!filter_json_output_content(content)) {
			//error has already been reported
			return;
		}
		
		var output_name=(m_step.outputs||{}).output;
		if (!output_name) {
			report_error('Missing required output: output');
			return;
		}
		m_output_files['output']={content:content};
		_setStatus('finished');
		/*
		var content_txt=JSON.stringify(content);
		var KC=m_job_manager.kuleleClient();
		if (!KC) {
			report_error('kulele client not defined.');
			return;
		}
		_setStatus('running');
		//todo: first locate to see if already on server
		KC.prvUploadText(content_txt,function(resp) {
			if (!resp.success) {
				report_error(resp.error);
				return;
			}
			var stat=resp.prv_stat;
			var prvobj={
				original_checksum:stat.checksum,
				original_size:stat.size,
				original_fcs:stat.fcs,
				original_path:resp.file_name
			};
			m_output_files['output']={prv:prvobj};
			_setStatus('finished');
		});
		*/
	}
	function getLabel() {
		if (!m_step) return '[nostep]';
		var ret=(m_step.step_type||'')+': ';
		ret+=m_step.processor_name||m_step.pipeline_name||'';
		return ret;
	}
	/*
	function check_ready_to_run(callback) {
		var parent_pipeline=m_job_manager.document().pipelineListManager().findPipeline(m_parent_pipeline_name);
		if (!parent_pipeline) {
			report_error('Unable to find pipeline by name: '+m_parent_pipeline_name);
			return;
		}
		
		var everything_ready=true
		m_input_files={};
		for (var iname in m_step.inputs) {
			var list0=m_step.inputs[iname].split(',');
			var list1=[];
			for (var jj=0; jj<list0.length; jj++) {
				var prvrec=get_input_file(parent_pipeline,m_parent_job.,list0[jj]);	
				if (!prvrec) {
					report_error('Cannot start job. Unable to find input file: '+list0[jj]);
					return;
				}
				if (!prvrec.prv) everything_ready=false;
				list1.push(prvrec);
			}
			if (list1.length==1) list1=list1[0];
			m_input_files[iname]=list1;
		}
		m_parameters=JSQ.clone(m_step.parameters);
		if (m_parent_job) {
			var parent_job_parameters=m_parent_job.parameters();
			for (var pname in m_parameters) {
				var pval=m_parameters[pname];
				if ((jsu_starts_with(pval,'${'))&&(jsu_ends_with(pval,'}'))) {
					
					var pname2=pval.slice(2,pval.length-1);

					if (!(pname2 in parent_job_parameters)) {
						report_error('Unable to find parameter in parent job: '+pname2);
						return;
					}
					var pval2=parent_job_parameters[pname2];
					m_parameters[pname]=pval2;
				}
			}
		}
		if (everything_ready) {
			callback();
		}
		else {
			setTimeout(function() {check_ready_to_run(callback);},200);
			return;
		}
	}
	*/
	function stop_pipeline() {
		_setStatus('error');
		_setError('stopped');
	}
}

