function jsqmain(query) {

    // The url query
    query=query||{};

    // Determine whether we are in local mode (i.e., whether we launched this as a desktop Qt GUI)
    var local_mode=(window.mlpipeline_mode=='local'); 

    // Determine whether we are running on localhost (development mode)
    var on_localhost=jsu_starts_with(window.location.href,'http://localhost');

    // Here is the main window
    var X=new MainWindow(null,{local_mode:local_mode});

    //Set up the DocStorClient, which will either be directed to localhost or the heroku app, depending on how we are running it.
    var DSC=new DocStorClient();
    if ((on_localhost)&&(!local_mode))
        DSC.setDocStorUrl('http://localhost:5011');
    else
        DSC.setDocStorUrl('https://docstor1.herokuapp.com');
    X.setDocStorClient(DSC);


    if (local_mode) {
        setup_local_mode(); // Using Qt desktop
    }
    else {
        setup_web_mode(); // Using web browser
    }

    function setup_web_mode() {
        // Using web browser

        // Switch to https protocol if needed
        if ((!on_localhost)&&(location.protocol != 'https:')) {
            location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
        
        X.showFullBrowser();
        X.setLoadingMessage('Starting ML Pipeline...');
        X.login({use_last_successful:true},function() {
            window.onbeforeunload = function (e) {
                if (!X.changesHaveBeenSaved()) {
                    var message = "Are you sure you want leave this page without saving changes?";
                    return message;
                }
            };
            
            if (query.load) {
                var url0=atob(query.load);
                X.loadFromConfigUrl(url0,false,function() {
                    X.setLoadingMessage('');   
                });
            }
            else if (query.browser_storage) {
                X.loadFromBrowserStorage(query.browser_storage,false,function() {
                    X.setLoadingMessage('');
                });
                
            }
            else if (query.user_storage=='true') {
                var server=query.server||'';
                var userid=query.userid||'';
                var filename=query.filename||'';
                if ((!server)||(!userid)||(!filename)) {
                    X.setLoadingMessage('Error in query parameters.');
                    return;
                }
                X.setProcessingServerName(server);
                setTimeout(function() {
                    //need to wait to allow the processing server name to be set on the kulele client
                    X.loadFromProcessingServer(userid,filename,false,function() {
                        X.setLoadingMessage('');
                    });
                },100);   
            }
            else if (query.docstor) {
                X.loadFromDocStor({title:query.docstor||'',owner:query.owner||'',promptsave:false},function() {
                    X.setLoadingMessage('');
                });
            }
            else {
                X.setLoadingMessage('');
            }
        });
    }

    function setup_local_mode() {
        window.download=function(text) {
            mlpinterface.download(text); //send it back to the C++
        }
        window.open=function(url) {
            alert('open: '+url);
        }
        X.kuleleClient().setLocalMode(true);
        X.kuleleClient().setLarinetServer(function(req,onclose,callback) {
            jsu_http_post_json('http://localhost:5005',req,{},function(resp) {
                if (!resp.success) {
                    callback(resp);
                    return;
                }
                callback(resp.object);
            });
            /*
            var cbcode=s_last_cb_code+1;
            s_last_cb_code=cbcode;
            window.callbacks[cbcode]=callback;
            window.mlpinterface.larinetserver(JSON.stringify(req),'window.callbacks['+cbcode+']');
            */
        });
        /*
        X.kuleleClient().setLarinetServer(function(req,onclose,callback) {
            var cbcode=s_last_cb_code+1;
            s_last_cb_code=cbcode;
            window.callbacks[cbcode]=callback;
            window.mlpinterface.larinetserver(JSON.stringify(req),'window.callbacks['+cbcode+']');
        });
        */


        // test the connection to larinet
        X.kuleleClient().getProcessorSpec(function(tmp) {
            if (!tmp.success) {
                show_full_browser_message('Unable to connect to local larinet server.','You must start the larinet service on your computer before running mlpipeline locally. <br /> It won\'t take very long.<br /><br /> For instructions, see mlpipeline/processing_server/larinet/README.txt');
                return;
            }
            X.showFullBrowser();
            X.setProcessingServerName('local');

            // Register plugins
            X.registerViewPlugin({
                file_extension:'.mv2',
                file_type:'MountainView',
                callback:function(name,content) {
                    window.mlpinterface.open_mountainview(JSON.stringify(content,null,4));
                }
            });

            X.registerPlugin({
                name:'mountainview',
                actions:[
                    {
                        name:'mountainview',
                        label:'MountainView',
                        callback:open_mountainview
                    }
                ]
            });
            X.setD
            X.loadFromBrowserStorage('default',false);
            function open_mountainview() {
                var dlg=new EditStepDialog();
                dlg.setSpec({
                    inputs:[
                        {name:'firings',optional:true},
                        {name:'raw',optional:true},
                        {name:'filt',optional:true},
                        {name:'pre',optional:true},
                    ],
                    outputs:[],
                    parameters:[{
                        name:'samplerate',optional:false
                    }]
                });
                dlg.setStep({step_type:'plugin',inputs:{firings:''},outputs:{},parameters:{samplerate:30000}});
                dlg.show();
                JSQ.connect(dlg,'accepted',0,function() {
                    var step0=dlg.step();
                    var firings=step0.inputs.firings||'';
                    var raw=step0.inputs.raw||'';
                    var filt=step0.inputs.filt||'';
                    var pre=step0.inputs.pre||'';
                    var mv2={};
                    mv2.samplerate=Number(step0.parameters.samplerate||0);
                    if (firings) mv2.firings=X.findPrvByName(firings);
                    mv2.timeseries={};
                    if (raw) mv2.timeseries['Raw Data']={name:'Raw Data',data:X.findPrvByName(raw)};
                    if (filt) mv2.timeseries['Filtered Data']={name:'Filtered Data',data:X.findPrvByName(filt)};
                    if (pre) mv2.timeseries['Preprocessed Data']={name:'Preprocessed Data',data:X.findPrvByName(pre)};
                    window.mlpinterface.open_mountainview(JSON.stringify(mv2,null,4));
                });
            }
        });
    }
}

function MessageWidget(O) {
    O=O||this;
    JSQWidget(O);
    O.div().addClass('MessageWidget');

    this.setMessage=function(msg) {m_message=msg; refresh();};
    this.setSubmessage=function(msg) {m_submessage=msg; refresh();};
    this.message=function() {return m_message;};
    this.submessage=function() {return m_submessage;};

    var m_message='';
    var m_submessage;

    function refresh() {
        O.div().html('<h2>'+m_message+'</h2><h3>'+m_submessage+'</h3>');
    }
}

function show_full_browser_message(msg,submessage) {
    var X=new MessageWidget();
    X.setMessage(msg);
    X.setSubmessage(submessage);
    X.showFullBrowser();
}

//window.callbacks={};
//var s_last_cb_code=0;