if (typeof module !== 'undefined' && module.exports) {
	exports.LocalStorage=LocalStorage;
}

function LocalStorage() {
	this.allNames=function() {return allNames();};
	this.writeObject=function(name,obj) {return writeObject(name,obj);};
	this.readObject=function(name) {return readObject(name);};

	function writeObject(name,obj) {
		try {
			localStorage[name]=JSON.stringify(obj);
			return true;
		}
		catch(err) {
			return false;
		}
	}
	function readObject(name) {
		var obj;
		try {
			var json=localStorage[name];
			if (!json) return null;
			obj=JSON.parse(json);
			return obj;
		}
		catch(err) {
			return null;
		}
	}
	function allNames() {
		var ret=[];
		try {
			for (var name in localStorage) {
				ret.push(name);
			}
		}
		catch(err) {

		}
		return ret;
	}
}