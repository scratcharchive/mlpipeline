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
	JSQObject=require(__dirname+'/../jsq/src/jsqcore/jsqobject.js').JSQObject;

	exports.MLPipelineListManager=MLPipelineListManager;
}

function MLPipelineListManager(O) {
	O=O||this;
	JSQObject(O);

	var that=this;

	this.addPipeline=function(pipeline) {addPipeline(pipeline)};
	this.pipelineCount=function() {return m_pipelines.length;};
	this.pipeline=function(i) {return m_pipelines[i];};
	this.findPipeline=function(name) {return findPipeline(name);};
	this.removePipeline=function(P) {removePipeline(P);};
	this.clearPipelines=function() {clearPipelines();};
	this.reorderPipelines=function(new_pipeline_order) {reorderPipelines(new_pipeline_order);};

	var m_pipelines=[];

	function addPipeline(P) {
		var last_name=P.name();
		m_pipelines.push(P);
		O.emit('changed');
		P.onChanged(function() {
			if (P.name()!=last_name) {
				O.emit('changed');
			}
			last_name=P.name();
		});
	}
	function removePipeline(P) {
		for (var i in m_pipelines) {
			if (m_pipelines[i]==P) {
				m_pipelines.splice(i,1);
				O.emit('changed');
				return;
			}
		}
	}
	function clearPipelines() {
		if (m_pipelines.length===0) return;
		m_pipelines=[];
		O.emit('changed');
	}
	function findPipeline(name) {
		for (var i in m_pipelines) {
			if (m_pipelines[i].name()==name)
				return m_pipelines[i];
		}
		return null;
	}
	function reorderPipelines(new_pipeline_order) {
		if (new_pipeline_order.length!=m_pipelines.length) {
			console.error('Incorrect length of new_pipeline_order in reorderPipelines');
			return;
		}
		var new_pipelines=[];
		for (var i=0; i<new_pipeline_order.length; i++) {
			new_pipelines.push(m_pipelines[new_pipeline_order[i]]);
		}
		m_pipelines=new_pipelines;
	}
}