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
	exports.MLPipeline=MLPipeline;
	exports.MLPipelineScript=MLPipelineScript;
}

function MLPipeline() {
	var that=this;

	this.object=function() {return clone(m_object);};
	this.setObject=function(obj) {setObject(obj);};
	this.name=function() {return that.spec().name;};
	this.setName=function(name) {setName(name);};
	this.spec=function() {return that.object().spec||{};};
	this.setSpec=function(spec) {setSpec(spec);};
	this.stepCount=function() {return m_object.steps.length;};
	this.steps=function() {return clone(m_object.steps);};
	this.setSteps=function(steps) {setSteps(steps);};
	this.step=function(i) {return clone(m_object.steps[i]);};
	this.setStep=function(i,step) {setStep(i,step);};
	this.addStep=function(step) {addStep(step);};
	this.insertStep=function(i,step) {insertStep(i,step);};
	this.removeStep=function(step) {removeStep(step);};
	this.clearSteps=function() {clearSteps();};
	this.onChanged=function(callback) {m_changed_callbacks.push(callback);};
	this.setRunHandler=function(run_handler) {m_run_handler=run_handler;};
	this.start=function() {start();};
	this.status=function() {return m_status;};
	this.stop=function() {stop();};
	this.reorderSteps=function(new_order) {reorderSteps(new_order);};
	this.getStepIndex=function(step) {return getStepIndex(step);};
	this.isPipelineScript=function() {return false;};
	this.export=function() {return m_object.export||false;};
	this.setExport=function(val) {m_object.export=val;};
	
	var default_spec={
			name:'',
			description:'',
			inputs:[],
			outputs:[],
			parameters:[]
	};
	var m_object={
		spec:default_spec,
		steps:[],
		input_files:[],
		output_files:[],
		export:false
	};
	var m_status='not_started'; // 'not_started','running','error','finished'
	var m_changed_callbacks=[];
	var m_jobs=[];
	var m_job_handler=new DummyJobHandler();
	function DummyJobHandler() {
		this.startJob=function(job_id,step) {};
		this.stepStatus=function() {return status;};
		this.stopJob=function() {/*not gonna do it*/};
		function startJob() {
			status='running';
			setTimeout(function() {status='finished';},1000);
		}
		var status='not_started';
	}
	function setObject(obj) {
		var a=clone(obj);
		a.steps=a.steps||[];
		a.spec=a.spec||default_spec;
		if (JSON.stringify(a)==JSON.stringify(m_object)) return;
		m_object=a;
		on_changed();
	}
	function setSteps(steps) {
		var object=clone(m_object);
		object.steps=steps;
		that.setObject(object);
	}
	function setStep(i,step) {
		if (i==that.stepCount()) {
			that.addStep(step);
			return;
		}
		var object=clone(m_object);
		object.steps[i]=step;
		that.setObject(object);
	}
	function insertStep(i,step) {
		var object=clone(m_object);
		object.steps.splice(i,0,clone(step));
		that.setObject(object);	
	}
	function setName(name) {
		var object=clone(m_object);
		object.spec.name=name;
		that.setObject(object);
	}
	function setSpec(spec) {
		var object=clone(m_object);
		object.spec=spec;
		that.setObject(object);
	}
	function addStep(step) {
		var object=clone(m_object);
		object.steps.push(step);
		that.setObject(object);
	}
	function removeStep(step) {
		var i=that.getStepIndex(step);
		if (i<0) return;
		var object=clone(m_object);
		object.steps.splice(i,1);
		that.setObject(object);
	}
	function clearSteps() {
		var object=clone(m_object);
		object.steps=[];
		that.setObject(object);	
	}
	function reorderSteps(new_step_order) {
		var steps=that.steps();
		if (new_step_order.length!=steps.length) {
			console.error('Incorrect length of new_step_order in reorderSteps');
			return;
		}
		var new_steps=[];
		for (var i=0; i<new_step_order.length; i++) {
			new_steps.push(steps[new_step_order[i]]);
		}
		that.setSteps(new_steps);
	}
	function getStepIndex(step) {
		for (var i=0; i<that.stepCount(); i++) {
			if (JSON.stringify(step)==JSON.stringify(that.step(i))) return i;
		}
		return -1;
	}
	function start() {
		if (m_status=='running') {
			console.log ('Warning: cannot start a pipeline that is already running.');
			return false;
		}
		m_jobs=[];
		for (var i=0; i<that.stepCount(); i++) {
			m_jobs.push({
				step:that.step(i),
				status:'pending',
				error:'',
				job_id:make_random_id(10)
			});
		}
		housekeeping();
	}
	function stop() {
		if (m_status!='running') {
			console.log ('Warning: cannot stop a pipeline that is not running.');
			return false;
		}
		for (var i=0; i<m_jobs.length; i++) {
			stop_job(m_jobs[i]);
		}
	}
	function housekeeping() {
		if (m_status=='running') {
			var everything_finished=true;
			for (var i=0; i<m_jobs.length; i++) {
				var job=m_jobs[i];
				if (job.status!='finished') everything_finished=false;
				if (job.status=='pending') {
					if (job_ready_to_run(job)) {
						start_job(job);
					}
				}
				else if (job.status=='running') {
					//update the status of running step
					job.status=job_status(job);
				}
				else if (job.status=='error') {
					m_status='error';
					m_error='Error running step ('+job.step.spec.name+'):'+job.error;
				}
				else if (job.status=='finished') {
					//good news!
				}
			}
			setTimeout(housekeeping,100);
		}
	}
	function job_status(job) {
		return m_run_handler.jobStatus(job.job_id);
	}
	function start_job(job) {
		m_run_handler.startJob(job.job_id,job.step);
		job.status='running';
	}
	function stop_job(job) {
		m_run_handler.stopJob(job.job_id);
	}

	function on_changed() {
		for (var i in m_changed_callbacks) {
			m_changed_callbacks[i]();
		}
	}
	function clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	function make_random_id(num_chars) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < num_chars; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}
}

function MLPipelineScript() {
	var that=this;

	this.object=function() {return clone(m_object);};
	this.setObject=function(obj) {setObject(obj);};
	this.name=function() {return m_object.name||'';};
	this.setName=function(name) {if (name==m_object.name) return; m_object.name=name; m_spec=null; on_changed();}
	this.pipeline=function(input_files,output_files,parameters) {return pipeline(input_files,output_files,parameters);};
	this.spec=function() {return spec();};
	this.error=function() {return m_error;}; //if pipeline returns null
	this.onChanged=function(callback) {m_changed_callbacks.push(callback);};
	this.isPipelineScript=function() {return true;};
	this.export=function() {return m_object.export||false;};
	this.setExport=function(val) {return m_object.export=val;};

	var m_object={name:'',script:'',export:false};
	var m_spec=null;
	var m_error='';
	var m_changed_callbacks=[];

	function setObject(obj) {
		if (JSON.stringify(obj)==JSON.stringify(m_object)) return;
		m_object=clone(obj);
		m_spec=null; //to force execution of script
		on_changed();
	}

	function spec() {
		if (m_spec) return m_spec;
		var P=pipeline(null,null,null,{spec_only:true});
		if (!P) return null;
		m_spec=P.spec();
		m_spec.name=m_object.name||'';
		return m_spec;
	}

	function pipeline(input_files,output_files,parameters,opts) {
		if (!opts) opts={};
		input_files=input_files||{};
		output_files=output_files||{};
		parameters=parameters||{};
		var script0=m_object.script||'';
		var script1='var _Pipeline={spec:{inputs:[],outputs:[],parameters:[]},steps:[]}; '+script0+'; _Pipeline';
		var _Pipeline
		try {
			_Pipeline=eval(script1);
		}
		catch(err) {
			console.error (err.stack);
			console.error (err.message);
			m_error='Error running script for pipeline: '+err.message;
			return null;
		}
		var obj1={spec:{},steps:[]};
		obj1.spec.inputs=_Pipeline.spec.inputs||[];
		obj1.spec.outputs=_Pipeline.spec.outputs||[];
		obj1.spec.parameters=_Pipeline.spec.parameters||[];
		obj1.steps=_Pipeline.steps||[];
		if (!opts.spec_only) {
			if (_Pipeline.run) {
				var X={
					runProcess:function(processor_name,inputs,outputs,params) {
						obj1.steps.push({step_type:'processor',processor_name:processor_name,inputs:inputs,outputs:outputs,parameters:params})
					},
					runPipeline:function(pipeline_name,inputs,outputs,params) {
						obj1.steps.push({step_type:'pipeline',pipeline_name:pipeline_name,inputs:inputs,outputs:outputs,parameters:params})
					},
					createJson:function(content,inputs,outputs,params) {
						obj1.steps.push({step_type:'json_output',content:content,inputs:inputs,outputs:outputs,parameters:params})
					},
					hasInput:function(iname) {
						if (input_files[iname]) return true;
						else return false;
					},
					hasOutput:function(oname) {
						if (output_files[oname]) return true;
						else return false;
					},
					parameters:parameters
				}
				try {
					var exit_code=_Pipeline.run(X);
					if (exit_code) {
						m_error='Script returned non-zero exit code.';
						return null;
					}
				}
				catch(err) {
					console.error (err.stack);
					console.error (err.message);
					m_error='Error running script for pipeline *: '+err.message;
					return null;
				}
			}
		}
		var P=new MLPipeline();
		P.setObject(obj1);
		return P;
	}
	function on_changed() {
		for (var i in m_changed_callbacks) {
			m_changed_callbacks[i]();
		}
	}

	function clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
}

