function url4text(txt,callback) {
  http_post_json('https://url4text.herokuapp.com/api/text/',{text:txt},{},cb);
  function cb(tmp) {
    if (!tmp.success) {
      callback(tmp);
      return;
    }
    var url0=tmp.object.raw||0;
    callback({success:true,url:url0});
  }
}

function http_post_json(url,data,headers,callback) {
  if (!callback) {
    callback=headers;
    headers=null;
  }

  var XX={
    type: "POST",
    url: url,
    data: data,
    success: success,
    dataType: 'json'
  };
  
  if (headers) {
    XX.headers=headers;
  }

  $.ajax(XX);

  function success(tmp) {
    callback({success:true,object:tmp});  
  }
}
