// postmongo client javascript library
console.log('postmongo loaded');

if(!window.jQuery){ // load jQuery if not there already
	(function(){
		var s = document.createElement('script');
		s.src = "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js";
		document.head.appendChild(s);
		console.log('jQuery added to the document head');
	})()
}

// connection specific components
postmongo=function(db_parm,cb0,err){ // object with connection parameters, see code for details
	// Process initial parameters
	if(!db_parm){db_parm={}};
	this.db_parm = db_parm ;
	// mininal defaults
	this.db_parm.server = this.db_parm.server || 'http://localhost:1337'; // default action is server in the localhost
	this.db_parm.url = this.db_parm.url || 'localhost'; // mongod address
	this.db_parm.port = this.db_parm.port || '27017'; // default mongod port
	this.db_parm.db = this.db_parm.db || 'test';  // default mongodb database
	// notify no authentication
	//if(!this.db_parm.u){console.log('no username provided')}
	//if(!this.db_parm.p){console.log('no password provided')}

	// Assemble connection string
	this.connector=this.db_parm.server+'/?url='+this.db_parm.url+'&port='+this.db_parm.port+'&db='+this.db_parm.db;
	if(!!this.db_parm.u){this.connector += '&u='+this.db_parm.u};
	if(!!this.db_parm.p){this.connector += '&p='+this.db_parm.p};
	if(!this.db_parm.dt){this.db_parm.dt={}};

	// Connect
	//if(!cb){cb=function(r){console.log(r)}}
	if(!cb0){
		cb0=function(r){ // default callback is to register collections as properties of this db
			//console.log(r);
			var db = postmongo.dbs[this.url]; // remember each db connected is tracked by the mothership
			db.showCollections(function(c){
					c = JSON.parse(c);
					db.col_names=[];
					console.log('Collections found:');
					c.forEach(function(ci){
						var cname=ci.name.match(/([^\.]+)\.(.*)/);
						db.db_name=cname[1]; // should be the same for all
						db.col_names.push(cname[2]);
						db[cname[2]]={col_name:cname[2]}; 
						// move here all the methods associated with collections, such as find
						db[cname[2]].find=postmongo.find;
						console.log(cname[2]); // list collections
					})

				})
		}
	}
	if(!this.db_parm.dt.exe){this.db_parm.dt.exe='res.end(JSON.stringify(dt));client.close()'}
	this.res = jQuery.post(this.connector,JSON.stringify(this.db_parm.dt),cb0);
	// MONGO client commands
	this.exe=function(cmd,exe_cb,dt){
		if(!exe_cb){exe_cb=function(x){console.log(x)}};
		if(!dt){dt={}};
		return postmongo.exe(cmd,exe_cb,dt,this.connector)
	};
	this.showCollections=function(cb1){ // mongo: "show collections", callback function is teh sole input
		if(!cb1){cb1=function(x){console.log(JSON.parse(x))}};
		this.exe('client.collectionNames(function(error,names){dt.names=names;res.end(JSON.stringify(dt.names));client.close();});',cb1);
	};
	this.colFind=function(col,q,q_cb){  // equivalent to mongo's db.col.find(q)
			// code missing here to make sure col collection exists and create otherwise
			if(!q_cb){q_cb=function(x){console.log(x)}};
			//this.exe('log(client.collection("lala"));res.end();client.close();',cb);
			this.exe('client.collection("'+col+'",function(err,col){col.find('+q+').toArray(function(err,docs){res.end(JSON.stringify(docs));client.close()})});',q_cb);
		}

	if(!postmongo.dbs){postmongo.dbs={}}; // keep track of connections in the template object
	postmongo.dbs[this.connector]=this; // 
	postmongo.dbi=this.connector; // keep track of current db
}

postmongo.exe=function(cmd,cbb,dt,db){ // command to be executed, callback on dt result, data to be used (dt), and target database 
	if(!db){db = postmongo.dbi} // default is current
	if(typeof(db)=='string'){db=postmongo.dbs[db]};
	if(!!dt){db.db_parm.dt=dt}; // if dt is provided, use it
	var db_parm = db.db_parm;
	db_parm.dt.exe=cmd;
	// ready for action
	return new postmongo(db_parm,cbb);
}


// Methods assigned to each collections
postmongo.find=function(q,q_cb){
	if(!q_cb){var q_cb=function(x){console.log(x)}};
	postmongo.exe('client.collection("'+this.col_name+'",function(err,col){col.find('+q+').toArray(function(err,docs){res.end(JSON.stringify(docs));client.close()})});',q_cb);
}


// 1. by passing parameter values with the URL
// x=jQuery.post('http://localhost:1337/?u=workshop&p=informatics&url=dharma.mongohq.com&port=10014&db=tcgaBoard&exe=console.log(dt)',JSON.stringify({x:[1,2,3]}),function(r){console.log(r)})
// 2. by including a .db_parm structure in the POSTed data
// x=jQuery.post('http://localhost:1337/tcgaBoard',JSON.stringify({db_parm:{"u":"workshop","p":"informatics","url":"dharma.mongohq.com","port":"10014","db":"lala","exe":"console.log(dt)"}}),function(r){console.log(r)})


// connection independent component


parm={
	server:'https://postmongo.herokuapp.com',
	u:"workshop",
	p:"informatics",
	url:"dharma.mongohq.com",
	port:"10014",
	db:"tcgaBoard",
	dt:{x:1,exe:'dt.y=dt.x+10;res.end(JSON.stringify(dt));client.close();'}
}

// a = new postmongo(db_parm,function(x){res=JSON.parse(x);console.log(res)})



//x=jQuery.post('http://localhost:1337/tcgaBoard',JSON.stringify({db_parm:{"u":"workshop","p":"informatics","url":"dharma.mongohq.com","port":"10014","db":"lala","eval":"console.log(dt)"}}),function(r){console.log(r)})
