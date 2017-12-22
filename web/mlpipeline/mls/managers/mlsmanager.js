function MLSManager() {
	this.setMLSObject=function(X) {m_study.setObject(X);};
  this.study=function() {return m_study;};

	var m_study=new MLStudy();
}

function MLStudy() {
  var that=this;
  
  this.object=function() {return JSQ.clone(m_object);};
  this.setObject=function(obj) {setObject(obj);};

  this.datasetIds=function() {return datasetIds();};
  this.dataset=function(id) {return dataset(id);};

  this.pipelineNames=function() {return pipelineNames();};
  this.pipeline=function(name) {return pipeline(name);};
  this.setPipeline=function(name,X) {setPipeline(name,X);};
  this.removePipeline=function(name) {removePipeline(name);};

  this.batchScriptNames=function() {return batchScriptNames();};
  this.batchScript=function(name) {return batchScript(name);};
  this.setBatchScript=function(name,X) {setBatchScript(name,X);};
  this.removeBatchScript=function(name) {removeBatchScript(name);};

  this.setDataset=function(id,X) {setDataset(id,X);};
  this.removeDataset=function(id) {removeDataset(id);};
  this.changeDatasetId=function(id,id_new) {changeDatasetId(id,id_new);};

  var m_object={
    datasets:{},
    pipelines:{},
    batch_scripts:{}
  };

  function setObject(obj) {
    m_object=JSQ.clone(obj);
    m_object.datasets=m_object.datasets||{};
    m_object.pipelines=m_object.pipelines||{};
    m_object.batch_scripts=m_object.batch_scripts||{};
  }

  function datasetIds() {
    var ret=Object.keys(m_object.datasets);
    ret.sort();
    return ret;
  }
  function dataset(id) {
    if (!(id in m_object.datasets)) return null;
    var obj=m_object.datasets[id];
    var ret=new MLSDataset(obj);
    return ret;
  }
  function pipelineNames() {
    var ret=Object.keys(m_object.pipelines);
    ret.sort();
    return ret;
  }
  function pipeline(name) {
    if (!(name in m_object.pipelines)) return null;
    var obj=m_object.pipelines[name];
    var ret=new MLSPipeline(obj);
    return ret;
  }
  function batchScriptNames() {
    var ret=Object.keys(m_object.batch_scripts);
    ret.sort();
    return ret;
  }
  function batchScript(name) {
    if (!(name in m_object.batch_scripts)) return null;
    var obj=m_object.batch_scripts[name];
    var ret=new MLSBatchScript(obj);
    return ret;
  }
  function setDataset(id,X) {
    m_object.datasets[id]=X.object();
  }
  function removeDataset(id) {
    if (id in m_object.datasets)
      delete m_object.datasets[id];
  }
  function changeDatasetId(id,id_new) {
    if (id==id_new) return;
    var X=dataset(id);
    if (!X) return;
    removeDataset(id);
    setDataset(id_new,X); 
  }
  function setPipeline(name,X) {
    m_object.pipelines[name]=X.object();
  }
  function removePipeline(name) {
    if (name in m_object.pipelines)
      delete m_object.pipelines[name];
  }
  function setBatchScript(name,X) {
    m_object.batch_scripts[name]=X.object();
  }
  function removeBatchScript(name) {
    if (name in m_object.batch_scripts)
      delete m_object.batch_scripts[name];
  }

}

function MLSDataset(obj) {
  var that=this;
  this.setObject=function(obj) {m_object=JSQ.clone(obj);};
  this.object=function() {return JSQ.clone(m_object);};

  this.id=function() {return m_object.id||'';};
  this.fileNames=function() {return fileNames();};
  this.file=function(name) {return file(name);};
  this.setFile=function(name,file0) {return setFile(name,file0);};
  this.parameters=function() {return JSQ.clone(m_object.parameters||{});};
  this.setParameters=function(params) {m_object.parameters=JSQ.clone(parms);};
  this.properties=function() {return JSQ.clone(m_object.properties||{});};
  this.setProperties=function(props) {m_object.properties=JSQ.clone(props);};

  var m_object={};

  function fileNames() {
    var files=m_object.files||{};
    var ret=[];
    for (var key in files) {
      ret.push(key);
    }
    return ret;
  }

  function file(name) {
    return (m_object.files||{})[name]||null;
  }
  function setFile(name,file0) {
    if (!m_object.files) m_object.files={};
    m_object.files[name]=JSQ.clone(file0);
  }

  that.setObject(obj||{});
}

function MLSPipeline(obj) {
  var that=this;
  this.setObject=function(obj) {m_object=JSQ.clone(obj);};
  this.object=function() {return JSQ.clone(m_object);};

  var m_object={};

  that.setObject(obj||{});
}

function MLSBatchScript(obj) {
  var that=this;
  this.setObject=function(obj) {m_object=JSQ.clone(obj);};
  this.object=function() {return JSQ.clone(m_object);};
  this.setScript=function(script) {m_object.script=script;};
  this.script=function() {return m_object.script||'';};

  var m_object={};

  that.setObject(obj||{});
}
