function $(id){return document.getElementById(id)}

var Diagrammer = {
	objects : {
		typical : [
			{
				name  : 'Квадрат',
				shape : 'rectangle',
				caption : 'Квадрат',
				icon : 'fa-square-o',
				id : 'square',
				width : 100,
				height : 100
			},
			{
				name  : 'Коло',
				shape : 'circle',
				caption : 'Коло',
				icon : 'fa-circle-thin',
				id : 'circle',
				width : 100,
				height : 100
			},
			{
				name  : 'Тригер',
				shape : 'circle',
				caption : 'Пожежа',
				icon : 'fa-circle-thin',
				id : 'fire',
				width : 100,
				height : 100,
				style : 'border:5px dashed coral;box-shadow:none;'
			}
		],
		unique : []
	},
	modes : {
		connector : false
	},
	generateId : function(){
		var id = "OBJ",
			chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		do{
			for(var i=0; i<15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
		}while( $(id) );
		return id;
	},
	initObjects : function(){
		with(this.objects){
			for(var i=0; i<typical.length; i++){
				$('typicalElements').innerHTML +=
					'<li><button onclick=\'Diagrammer.elements.add('+JSON.stringify(typical[i])+')\'>'+
					'<i class="fa '+typical[i].icon+'" aria-hidden="true"></i>'+typical[i].name+'</button>'+
					'<i class="fa fa-times close" aria-hidden="true" onclick="Diagrammer.elements.close(this)"></i></li>';
			};
			for(var i=0; i<unique.length; i++){
				$('uniqueElements').innerHTML += 
					'<li><button onclick=\'Diagrammer.elements.add('+JSON.stringify(unique[i])+')\'>'+
					'<i class="fa '+unique[i].icon+'" aria-hidden="true"></i>'+unique[i].name+'</button>'+
					'<i class="fa fa-times close" aria-hidden="true" onclick="Diagrammer.elements.close(this)"></i></li>';
			};
		}
	},
	elements : {
		list : [],
		add : function(properties, completed){
			var el = document.createElement('div');
			with(el){
				setAttribute( 'id', Diagrammer.generateId() );
				if(!completed){
					className = 'figure ' + properties.shape;
					var Style = 'width:'+properties.width+'px;height:'+properties.height+'px;top:50px;left:50px;';
					if(properties.style) Style += properties.style;
					setAttribute('style', Style);
					setAttribute('data-x', '0');
					setAttribute('data-y', '0');
					setAttribute('shape', properties.shape);
				}else{
					setAttribute('style', properties.style);
					setAttribute('class', properties.class);
					setAttribute('data-x', properties.dataX);
					setAttribute('data-y', properties.dataY);
				}
				setAttribute('objId', properties.id);
				innerHTML = '<div class="options">'+
								'<button title="'+Diagrammer.msgs.properties+'"><i class="fa fa-cogs" aria-hidden="true"></i></button>'+
								'<button title="'+Diagrammer.msgs.delete+'" onclick="'+
									'if( confirm( Diagrammer.msgs.getMsg( {type:\'info\', msg:\'really_del_el\'} ) ) ) Diagrammer.elements.del( this.parentNode.parentNode );'+
								'"><i class="fa fa-trash-o" aria-hidden="true"></i></button>'+
								'<button title="'+Diagrammer.msgs.del_all_el_connections+'" onclick="'+
									'if( confirm( Diagrammer.msgs.getMsg( {type:\'info\', msg:\'really_del_connections\'} ) ) ) Diagrammer.connector.delAllForEl( this.parentNode.parentNode );'+
								'"><i class="fa fa-chain-broken" aria-hidden="true"></i></button>'+
							'</div><div>'+properties.caption+'</div>';
			};
			$('container').appendChild(el);
			interact(el).draggable({
				enable : true,
				snap: {  targets: [ interact.createSnapGrid({ x: 10, y: 10 })  ] }
			})
			.resizable({
				edges: { top   : true, left  : true, bottom: true, right : true },
				snap: {  targets: [ interact.createSnapGrid({ x: 10, y: 10 })  ] }
			})
			.on('dragmove', function (event) {
				with(event){
					target.style.top = target.offsetTop + dy + 'px';
					target.style.left = target.offsetLeft + dx+'px';
					changeState(
						Diagrammer.msgs.getMsg({type:'statebar', msg:'position_change', vars:[
							{var:'pos', value:target.offsetTop + ' / ' + target.offsetLeft}
						]})
					);
					Diagrammer.arrows.check(event);
			    }
			})
			.on('resizemove', function (event) {
			    var target = event.target;
			        x = (parseFloat(target.getAttribute('data-x')) || 0),
			        y = (parseFloat(target.getAttribute('data-y')) || 0);
			    target.style.width  = event.rect.width + 'px';
			    target.style.height = event.rect.height + 'px';
			    x += event.deltaRect.left;
			    y += event.deltaRect.top;
			    target.setAttribute('data-x', x);
				target.setAttribute('data-y', y);
			    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px,' + y + 'px)';
			    changeState(
					Diagrammer.msgs.getMsg({type:'statebar', msg:'size_change', vars:[
						{var:'size', value:target.offsetWidth + ' : ' + target.offsetHeight}
					]})
				);
				Diagrammer.arrows.check(event);
			})
			.on('dragend', function(event){ stateDone(); })
			.on('resizeend', function(event){ stateDone(); })
			.on('doubletap', function(event){
				event.target.children[1].innerHTML = '<input type="text" value="'+event.target.children[1].innerHTML+'" onkeypress="if(event.keyCode==13) this.parentNode.innerHTML=this.value" />';
				event.target.children[1].children[0].focus();
				event.target.children[1].children[0].select();
			});
			el.addEventListener('mouseover',(function(e){
				if( !Diagrammer.modes.connector ){
					var el = e.target;
					if( el.parentNode.className.indexOf('figure')!==-1 ) el = el.parentNode;
					if( el.className.indexOf('figure')==-1 ) return;
					el.children[0].style.display = 'block';
				}
				var els = document.getElementsByTagName('line');
				if(els.length<1) return false;
				for(var i=0; i<els.length; i++){
					var id = els[i].getAttribute('id').split('/');
					if( id[0]!=='arrow' ) continue;
					if( id[1]==e.target.getAttribute('id') ){ els[i].setAttribute('class', 'connector') }
					if( id[2]==e.target.getAttribute('id') ){ els[i].setAttribute('class', 'connected') }
				}
			}));
			el.addEventListener('mouseleave',(function(e){
				e.target.children[0].style.display = 'none';
				var els = document.getElementsByTagName('line');
				if(els.length<1) return false;
				for(var i=0; i<els.length; i++)
					if( els[i].getAttribute('id').indexOf( e.target.getAttribute('id') )!==-1 )
						els[i].setAttribute('class', '');
			}));
			el.connections = [];
			el.connectFrom = [];
			this.list.push(el);
			stateDone();
			$('arrows').innerHTML = $('arrows').innerHTML+' ';
			return el;
		},
		del : function(el){
			this.list.splice( this.list.indexOf(el), 1 );
			Diagrammer.connector.delAllForEl(el);
			removeEl(el);
			stateDone();
		},
		connect : function(from, to){
			if( from.className.indexOf('figure')==-1 || to.className.indexOf('figure')==-1 ) return false;
			if( from.connections.indexOf(to)!==-1 ) return { type:'statebar', msg:'connect_already_existing' };
			if( from.id==to.id ) return { type:'statebar', msg:'cant_connect_self' };
			from.connections.push( to );
			to.connectFrom.push( from );
			Diagrammer.arrows.draw({ target : from });
			$('arrows').innerHTML = $('arrows').innerHTML+' ';
			return { type:'statebar', msg:'connect_created' };
		},
		disconnect : function(from, to){
			if( !from || !to ) return { type:'statebar', msg:'unrecognized_error' };
			if( from.className.indexOf('figure')==-1 || to.className.indexOf('figure')==-1 ) return { type:'statebar', msg:'unrecognized_error' };
			if( from.connections.indexOf(to)==-1 ) return { type:'statebar', msg:'unexisting_connection' };
			else{
				from.connections.splice( from.connections.indexOf(to), 1 );
				to.connectFrom.splice( to.connections.indexOf(from), 1 );
			}
			Diagrammer.arrows.del( from.getAttribute('id'), to.getAttribute('id') );
			return { type:'statebar', msg:'connection_deleted' };
		},
		delAll : function(){
			while( this.list.length>0 ) this.del( this.list[0] );
		},
		create : function(){
			var properties = JSON.stringify({
				name  : $('window/createElement/name').value,
				shape : $('window/createElement/shape').value,
				caption : $('window/createElement/caption').value,
				icon : $('window/createElement/icon').value,
				id : $('window/createElement/id').value,
				width : $('window/createElement/width').value,
				height : $('window/createElement/height').value,
				style : $('window/createElement/style').value
			});
			$('typicalElements').innerHTML += 
				'<li><button onclick=\'Diagrammer.elements.add('+properties+')\'>'+
				'<i class="fa '+$('window/createElement/icon').value+'" aria-hidden="true"></i>'+$('window/createElement/name').value+'</button>'+
				'<i class="fa fa-times close" aria-hidden="true" onclick="Diagrammer.elements.close(this)"></i></li>';
			Diagrammer.windows.close('createElement');
		},
		close : function(button){
			if( confirm( Diagrammer.msgs.getMsg({ type:'info', msg:'really_del_el_template' }) ) )
				button.parentNode.remove();
		}
	},
	arrows : {
		get : function(id1, id2){ return $('arrow/'+id1+'/'+id2) /*|| $('arrow/'+id2+'/'+id1)*/ || undefined; },
		create : function(id1, id2, line){
			if( Diagrammer.arrows.get(id1, id2) ) return false;
			$('arrows').appendChild(line);
		},
		del : function(id1, id2){
			removeEl( $('arrow/'+id1+'/'+id2) );
		},
		draw : function(e){
			if(e.target.connections.length==0) return;
			function getPoints(left, top, width, height, dataX, dataY){
				var edges = {
					x0: left+dataX,			y0: top+dataY,
					x1: left+width+dataX,	y1: top+dataY,
					x2: left+width+dataX,	y2: top+height+dataY,
					x3: left+dataX,			y3: top+height+dataY
				},
				points = {
					x0: (edges.x0+edges.x1)/2,	y0: edges.y0,
					x1: edges.x1,				y1: (edges.y1+edges.y2)/2,
					x2: (edges.x0+edges.x1)/2,	y2: edges.y3,
					x3: edges.x3,				y3: (edges.y0+edges.y2)/2
				};
				return points;
			}
			function l(x0, y0, x1, y1){ return Math.sqrt( Math.pow(x0-x1,2) + Math.pow(y0-y1,2) ) } //length
			function drawArrow(points, id1, id2){
				var line = Diagrammer.arrows.get(id1, id2);
				if( !line ){
					line = document.createElement('line');
					line.id = 'arrow/'+id1+'/'+id2;
				}
				line.setAttribute('x1', points[0]);
				line.setAttribute('y1', points[1]);
				line.setAttribute('x2', points[2]);
				line.setAttribute('y2', points[3]);
				return line;
			}
			var points1 = getPoints(e.target.offsetLeft, e.target.offsetTop,
									e.target.offsetWidth, e.target.offsetHeight,
									e.target.getAttribute('data-x')*1, e.target.getAttribute('data-y')*1);
			var arrTo = e.target.connections;
			for(var i=0; i<arrTo.length; i++){
				var points2 = getPoints(arrTo[i].offsetLeft, arrTo[i].offsetTop,
										arrTo[i].offsetWidth,arrTo[i].offsetHeight,
										arrTo[i].getAttribute('data-x')*1, arrTo[i].getAttribute('data-y')*1);
				var paths = [
					[points1.x0, points1.y0, points2.x0, points2.y0],
					[points1.x0, points1.y0, points2.x1, points2.y1],
					[points1.x0, points1.y0, points2.x2, points2.y2],
					[points1.x0, points1.y0, points2.x3, points2.y3],
					[points1.x1, points1.y1, points2.x0, points2.y0],
					[points1.x1, points1.y1, points2.x1, points2.y1],
					[points1.x1, points1.y1, points2.x2, points2.y2],
					[points1.x1, points1.y1, points2.x3, points2.y3],
					[points1.x2, points1.y2, points2.x0, points2.y0],
					[points1.x2, points1.y2, points2.x1, points2.y1],
					[points1.x2, points1.y2, points2.x2, points2.y2],
					[points1.x2, points1.y2, points2.x3, points2.y3],
					[points1.x3, points1.y3, points2.x0, points2.y0],
					[points1.x3, points1.y3, points2.x1, points2.y1],
					[points1.x3, points1.y3, points2.x2, points2.y2],
					[points1.x3, points1.y3, points2.x3, points2.y3],
				],
				lengths = [];
				for(var j=0; j<paths.length; j++) lengths[j] = l.apply( null, paths[j] );
				var line = drawArrow( paths[ lengths.indexOf( lengths.reduce( (p, c) => p<c ? p : c ) ) ], e.target.id, arrTo[i].id );
				if( !Diagrammer.arrows.get(e.target.id, arrTo[i].id) ) Diagrammer.arrows.create(e.target.id, arrTo[i].id, line);
			}
		},
		check : function(event){
			Diagrammer.arrows.draw(event);
			var connFrom = event.target.connectFrom;
			if(connFrom.length>0) for(var i=0; i<connFrom.length; i++) Diagrammer.arrows.draw( {target:connFrom[i]} );
		}
	},
	connector : {
		stackArr : [],
		mode : undefined,
		on : function(mode){
			Diagrammer.modes.connector = !Diagrammer.modes.connector;
			if(Diagrammer.modes.connector){
				changeState(
					Diagrammer.msgs.getMsg({ type:'statebar', msg:'select_els_for_'+( mode=='connect' ? 'add' : 'del' ) })
				);
				document.body.className = 'connect';
				this.mode = mode;
			}else{
				document.body.className = '';
				this.mode = undefined;
			}
		},
		stack : function(el, mode){ //mode == 'connect'/'disconnect'
			if( el.parentNode.className.indexOf('figure')!==-1 ) el = el.parentNode;
			if( el.className.indexOf('figure')==-1 ) return;
			if(this.stackArr.length < 2) this.stackArr.push(el);
			if(this.stackArr.length == 2){
				changeState( Diagrammer.msgs.getMsg( Diagrammer.elements[mode](this.stackArr[0], this.stackArr[1]) ),  2);
				this.stackArr = [];
				this.on();
			};
			if(this.stackArr.length > 2) {return changeState( Diagrammer.msgs.getMsg( {type:'error',msg:'unrecognized_error'} ) )}
		},
		delAll : function(){
			for(var i=0; i<Diagrammer.elements.list.length; i++) this.delAllForEl( Diagrammer.elements.list[i] );
		},
		delAllForEl : function(el){
			if(el.connections.length!==0) while(el.connections.length>0) Diagrammer.elements.disconnect( el, el.connections[0] );
			if(el.connectFrom.length!==0) while(el.connectFrom.length>0) Diagrammer.elements.disconnect( el.connectFrom[0], el );

			//if(el.connections.length!==0) for(var i=0; i<=el.connections.length; i++) Diagrammer.elements.disconnect( el, el.connections[i] );
			//if(el.connectFrom.length!==0) for(var i=0; i<=el.connectFrom.length; i++) Diagrammer.elements.disconnect( el.connectFrom[i], el );
		}
	},
	windows : {
		open : function(id){ $('window/'+id).style.display = 'block' },
		close : function(id){ $('window/'+id).style.display = 'none' }
	},
	msgs : {
		error_Message				: 'Помилка',
		info_Message				: 'Повідомлення',
		connect_already_existing	: 'Дане з\'єднання вже існує. Не можна пов\'язувати вже пов\'язані елементи.',
		cant_connect_self			: 'Неможливо пов\'язати об\'єкт сам із собою.',
		unexisting_connection		: 'Цього з\'єднання і так не існувало.',
		connect_created				: 'З\'єднання створено.',
		connection_deleted			: 'З\'єднання видалено.',
		del_all_connections			: 'Дійсно видалити всі зв\'язки на цій сторінці?',
		select_els_for_del			: 'Почергово виділити два елементи, для яких треба видалити зв\'язок.',
		select_els_for_add			: 'Почергово виділити два елементи, для яких треба створити зв\'язок.',
		cant_add_unique_el			: 'На одній сторінці не може існувати кілька унікальних елементів.',
		really_del_el_template		: 'Дійсно видалити даний елемент зі списку доступних?',
		really_del_el				: 'Дійсно видалити даний елемент?',
		really_del_connections		: 'Дійсно видалити всі зв\'язки для цього елементу?',
		really_del_all				: 'Дійсно очистити сторінку?',
		really_del_all_conns		: 'Дійсно видалити всі зв\'язки на сторінці?',
		size_change					: 'Зміна розміру: %size%',
		position_change				: 'Зміна позиції: %pos%',
		state_done					: 'Елементів: %els%',
		unrecognized_error			: 'Виникла непередбачувана помилка',
		properties					: 'Властивості',
		del_all_el_connections		: 'Знищити всі зв\'язки для цього об\'єкту',
		delete						: 'Видалити',
		getMsg : function(e){ //e{type:str, msg:str, vars:arr} / vars == [{var:'var_name', value:bla},...] / string == 'bla %var_name% bla';
			var msg = Diagrammer.msgs[e.msg];
			if(e.type!=='statebar') msg = Diagrammer.msgs[e.type+'_Message'] + ': ' + msg;
			if(e.vars) for(var i=0; i<e.vars.length; i++) msg = msg.split('%'+e.vars[i].var+'%').join(e.vars[i].value);
			return msg;
		},
		getCapt : function(name){ return Diagrammer.msgs[name]; }
	},
	stringify : function(full){
		var line = '{';
		var list = Diagrammer.elements.list;
		if(!full){
			for(var i=0; i<list.length; i++) line += i+'::i:'+escape( list[i].getAttribute('objID') )+';c:'+escape( list[i].children[1].innerHTML )+';/';
		}else{
			for(var i=0; i<list.length; i++)
				line += i+'::id:'+escape( list[i].getAttribute('objID') )+';caption:'+escape( list[i].children[1].innerHTML )+';'+
						'class:'+list[i].getAttribute('class')+';style:'+escape( list[i].getAttribute('style') )+';'+
						'dataX:'+list[i].getAttribute('data-x')+';dataY:'+list[i].getAttribute('data-y')+';/';
		}
		line += '|';
		for(var i=0; i<list.length; i++){ if( list[i].connections.length!==0 ){
			line += i + '>';
			for(var j=0; j<list[i].connections.length; j++){
				line += Diagrammer.elements.list.indexOf( list[i].connections[j] );
				if( j < list[i].connections.length-1 ) line += ',';
			}
			if(i<list.length-1) line += ';';
	    }}
		return line += '}';
	},
	parse : function(l){
		var objs = {}, connections = {};
			l = l.substr(1, l.length-2).split('|');
			l[0] = l[0].split('/'); l[1] = l[1].split(';');
			if( l[0].length>1 ) for(var i=0; i<l[0].length; i++){
				if( l[0][i].length<=1 ) continue;
				l[0][i] = l[0][i].split('::');
				objs[ l[0][i][0] ] = {};
				l[0][i][1] = l[0][i][1].split(';');
				for(var j=0; j<l[0][i][1].length; j++){
					if( l[0][i][1][j].length<=1 ) continue;
					l[0][i][1][j] = l[0][i][1][j].split(':');
					objs[ l[0][i][0] ][ unescape( l[0][i][1][j][0] ) ] = unescape( l[0][i][1][j][1] );
				}
			}
			if( l[1].length>1 ) for(var i=0; i<l[1].length; i++){
				if( l[1][i].length<=1 ) continue;
				l[1][i] = l[1][i].split('>');
				connections[ l[1][i][0] ] = l[1][i][1].split(',');
			}
		return {objs: objs, conns: connections};
	},
	save : function(){
		var l = $('savedInfo').value = this.stringify(true);
		Cookies.set('saved', l);
	},
	open : function(l){
		l = this.parse(l);
		for(var i in l.objs) this.elements.add(l.objs[i], true);
		for(var i in l.conns){
			for(var j=0; j<l.conns[i].length; j++){
				Diagrammer.elements.connect( Diagrammer.elements.list[i], Diagrammer.elements.list[ l.conns[i][j]*1 ] );
			}
		}
	},
	done : function(){
		this.windows.open('stringifyed');
		$('window/strigifyed/text').value = this.stringify(false);
	}
}

function stateDone(){
	$('state').className = 'visible';
	$('state').innerHTML = Diagrammer.msgs.getMsg({type:'statebar', msg:'state_done', vars:[
		{var:'els', value:Diagrammer.elements.list.length}
	]})
	/*$('state').className = 'hidden';*/
}

function changeState(text, duration){
	$('state').innerHTML = text;
	//className = 'visible';
	if(duration) setTimeout((function(){
			stateDone()
	}), duration*1000);
}

function removeEl(el){
	window.remove_element.push(el);
	el.style.display = 'none';
	setTimeout( (
		function(){ while(window.remove_element.length>0){
			window.remove_element[0].remove();
			window.remove_element.splice(0, 1);
		} }
	), 1000 );
}

document.body.addEventListener('click',function(e){
	if(Diagrammer.modes.connector){ Diagrammer.connector.stack(e.target, Diagrammer.connector.mode); }
});

window.remove_element = [];
Diagrammer.initObjects();

stateDone();