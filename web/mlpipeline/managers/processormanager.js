if (typeof module !== 'undefined' && module.exports) {
    JSQObject=require(__dirname+'/../jsq/src/jsqcore/jsqobject.js').JSQObject;

    exports.ProcessorManager=ProcessorManager;
}

function ProcessorManager(O,context) {
	O=O||this;
	JSQObject(O);

	this.setSpec=function(spec) {setSpec(spec);};
	this.processorNames=function() {return processorNames();};
	this.processorSpec=function(processor_name) {return processorSpec(processor_name);};
    this.metaProcessor=function(processor_name) {return JSQ.clone(m_meta_processors[processor_name]);};
    this.registerProcessor=function(spec) {registerProcessor(spec);};
    this.numProcessors=function() {var num=0; for (var key in m_processor_specs) num++; return num;};
    //this.registerMetaProcessor=function(obj) {registerMetaProcessor(obj);};

	var m_processor_specs={};
    //var m_meta_processors={};

	function setSpec(spec) {
        m_processor_specs={};
        spec.processors=spec.processors||[];
        for (var key in spec.processors) {
            O.registerProcessor(spec.processors[key]);
        }
        /*
        for (var key in processor_manager_spec.processors) {
            O.registerProcessor(processor_manager_spec.processors[key]);
        }
		//m_processor_specs=processor_manager_spec;
		if (callback) callback();
        */
	}
	function processorNames() {
		var ret=[];
        for (var name in m_processor_specs) {
            ret.push(name);
        }
        ret.sort();
		return ret;
	}
	function processorSpec(processor_name) {
        if (processor_name in m_processor_specs) {
            return JSQ.clone(m_processor_specs[processor_name]);
        }
        else return null;
	}
    function registerProcessor(spec) {
        m_processor_specs[spec.name]=JSQ.clone(spec);
    }
    /*
    function registerMetaProcessor(obj) {
        var obj0=JSQ.clone(obj);
        obj0.spec.meta=true;
        m_meta_processors[obj0.spec.name]=obj0;
        m_processor_specs[obj0.spec.name]=obj0.spec;
    }
    */
}
