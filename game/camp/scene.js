/* Shared Phaser walking engine; each location provides its own model and map. */
(() => {
  'use strict';
  const C=CampModel;
  class CampScene extends Phaser.Scene {
    constructor(){super('Camp');this.direction='down';this.lastSave=0;this.handledKeys=new WeakSet();}
    get model(){return this.options.model||C;}
    preload(){
      this.load.spritesheet('trainer',this.options.trainer.sheet,{frameWidth:32,frameHeight:48});
      for(const m of this.options.team){
        if(this.textures.exists('mon-'+m.index))continue;
        if(m.asset.mode==='walk')this.load.spritesheet('mon-'+m.index,m.asset.sheet,{frameWidth:32,frameHeight:48});
        else this.load.image('mon-'+m.index,m.asset.sheet);
      }
      this.load.on('loaderror',file=>this.options.onError(`Não foi possível carregar ${file.key}. Volte e tente novamente.`));
    }
    makeMap(){
      if(this.options.kind==='center'){this.makeCenterMap();return;}if(this.options.kind==='route'){this.makeRouteMap();return;}
      const g=this.add.graphics(),rect=(x,y,w,h,c)=>{g.fillStyle(c);g.fillRect(x,y,w,h);},poly=(pts,c)=>{g.fillStyle(c);g.fillPoints(pts.map(([x,y])=>({x,y})),true);};
      rect(0,0,640,416,0x729653);
      // Repeatable pixel grass. No external map or image download is needed.
      let seed=4721;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let y=0;y<416;y+=16)for(let x=0;x<640;x+=16){
        rect(x,y,16,16,rand()>.5?0x769c58:0x719653);
        if(rand()>.4){const a=x+Math.floor(rand()*10),b=y+Math.floor(rand()*10);rect(a,b+2,2,2,0x63864a);rect(a+2,b,2,3,0x63864a);rect(a+4,b+2,2,2,0x63864a);}
      }
      poly([[161,171],[234,126],[405,127],[453,179],[420,248],[395,284],[409,324],[365,355],[282,358],[230,324],[219,269],[174,246]],0x829e5c);
      // Worn paths connect the entrance, tent and fire circle.
      poly([[301,416],[342,416],[342,346],[361,318],[351,279],[347,233],[367,210],[350,184],[341,144],[298,144],[295,185],[277,211],[294,245],[294,284],[302,327]],0xc0b37b);
      rect(301,137,40,36,0xc0b37b);
      poly([[306,332],[210,321],[187,300],[201,282],[309,304]],0xb9af76);
      poly([[334,201],[413,198],[444,211],[429,230],[338,228]],0xb9af76);
      for(let i=0;i<120;i++){const x=285+rand()*65,y=145+rand()*270;if(y>240||y<185)rect(x,y,2,1,0xa59864);}
      // Pond: stepped shoreline, pale rim and three levels of water.
      poly([[449,261],[518,261],[518,269],[543,269],[550,284],[550,320],[535,341],[457,341],[433,321],[433,281]],0xb8ad78);
      poly([[456,269],[514,269],[514,277],[537,277],[543,289],[543,315],[529,333],[462,333],[442,315],[442,288]],0x537f78);
      poly([[462,278],[509,278],[509,284],[533,284],[535,312],[523,325],[467,325],[450,310],[450,294]],0x719d9a);
      rect(462,288,36,2,0x9bbbb0);rect(497,309,24,2,0x9bbbb0);rect(462,319,13,2,0x9bbbb0);
      for(const [x,y] of [[441,277],[539,332],[449,337]]){rect(x,y-9,2,14,0x3d7254);rect(x+3,y-5,2,10,0x3d7254);rect(x-2,y-11,6,3,0x7c7950);}
      // Wooden fence across the entrance edge, with a gap in the centre.
      for(const [a,b] of [[92,283],[358,552]]){rect(a,389,b-a,3,0x69553e);rect(a,399,b-a,3,0x69553e);for(let x=a;x<b;x+=22){rect(x,384,5,24,0x69553e);rect(x+1,384,2,23,0xaa9160);}}
      // Flowers and wild grass outside the paths.
      for(const [x,y] of [[163,174],[178,329],[431,253],[406,339],[254,154],[113,279],[528,221],[239,367]]){
        rect(x,y,2,6,0x457448);rect(x-2,y-2,6,3,0xead8a1);rect(x,y-3,2,5,0xe3b779);
      }
      g.generateTexture('camp-ground',640,416);g.destroy();this.add.image(0,0,'camp-ground').setOrigin(0);
      this.blockers=this.physics.add.staticGroup();
      this.model.obstacles.forEach(o=>{
        const zone=this.add.zone(o.x+o.w/2,o.y+o.h/2,o.w,o.h);this.physics.add.existing(zone,true);this.blockers.add(zone);
      });
      const stamp=(key,w,h,x,y,depth,draw)=>{const t=this.add.graphics();draw(t,(a,b,c,d,col)=>{t.fillStyle(col);t.fillRect(a,b,c,d);},(pts,col)=>{t.fillStyle(col);t.fillPoints(pts.map(([a,b])=>({x:a,y:b})),true);});t.generateTexture(key,w,h);t.destroy();return this.add.image(x,y,key).setOrigin(.5,1).setDepth(depth);};
      // Layered treetops share one texture. Depth follows their trunk so players can walk behind them.
      stamp('camp-tree',64,80,-100,-100,0,(t,r,p)=>{
        t.fillStyle(0x476740,.35);t.fillEllipse(32,74,50,10);r(26,49,12,25,0x594f35);r(29,51,4,21,0x9c8350);
        p([[6,61],[11,49],[4,49],[15,32],[10,31],[25,7],[39,7],[54,31],[49,32],[60,49],[53,49],[58,61],[43,68],[19,68]],0x355b3c);
        p([[8,50],[18,33],[15,30],[29,9],[36,9],[50,30],[46,33],[56,51],[42,58],[21,58]],0x4f7a45);
        p([[15,43],[24,27],[20,27],[30,12],[35,12],[45,27],[41,30],[49,43],[37,49],[25,48]],0x72984e);
        r(24,26,8,3,0x88ac59);r(18,42,8,3,0x88ac59);r(37,35,7,3,0x88ac59);
      });
      // Dense forest behind the collidable foreground trees.
      for(let x=0;x<660;x+=42)this.add.image(x,57+(x%3)*5,'camp-tree').setOrigin(.5,1).setDepth(25);
      for(let y=110;y<410;y+=44){this.add.image(22,y,'camp-tree').setOrigin(.5,1).setDepth(y);this.add.image(620,y,'camp-tree').setOrigin(.5,1).setDepth(y);}
      C.trees.forEach(([x,y])=>this.add.image(x,y+4,'camp-tree').setOrigin(.5,1).setDepth(y));
      stamp('camp-tent',128,104,320,145,143,(t,r,p)=>{
        t.fillStyle(0x476740,.3);t.fillEllipse(65,96,122,12);
        p([[11,93],[38,20],[67,20],[114,93]],0x476246);p([[9,91],[45,13],[64,13],[102,91]],0xabc18a);
        p([[63,13],[115,90],[101,91]],0x6f8e60);p([[11,90],[45,16],[47,90]],0x96ae78);
        p([[44,88],[63,32],[87,88]],0x354d3c);p([[47,88],[61,45],[62,88]],0x5e7452);
        r(5,93,118,3,0x5e6041);r(57,14,10,3,0xcbd2a0);r(19,74,7,3,0xcbd2a0);
        r(0,92,3,8,0x6d5b3e);r(122,92,3,8,0x6d5b3e);
      });
      stamp('camp-log',94,31,312,286,286,(t,r,p)=>{t.fillStyle(0x476740,.3);t.fillEllipse(47,27,94,7);r(9,8,76,17,0x6a5137);r(9,10,76,4,0xa48a58);r(12,20,65,2,0x493f31);r(3,8,10,17,0xba9a65);r(4,11,5,9,0x80633f);r(84,8,7,17,0x80633f);});
      stamp('camp-crate',34,32,397,133,133,(t,r)=>{r(2,3,30,27,0x594d35);r(4,5,26,23,0x9d8251);r(6,7,22,3,0xb99b62);r(6,15,22,2,0x6f5a3c);r(6,22,22,2,0x6f5a3c);r(9,5,3,23,0x715b3c);r(23,5,3,23,0x715b3c);});
      stamp('camp-rock',40,28,-100,-100,0,(t,r,p)=>{t.fillStyle(0x476740,.3);t.fillEllipse(20,24,37,7);p([[3,22],[6,10],[14,4],[29,5],[37,15],[35,24]],0x727963);p([[7,17],[11,8],[26,7],[32,14],[25,17]],0xa6ad8b);r(12,9,10,3,0xc0c4a0);});
      this.add.image(159,260,'camp-rock').setOrigin(.5,1).setDepth(260);this.add.image(498,181,'camp-rock').setOrigin(.5,1).setDepth(181);
      stamp('camp-fire-ring',50,25,320,238,207,(t,r)=>{t.fillStyle(0x846d45);t.fillEllipse(25,13,48,23);for(const [x,y]of[[2,8],[9,2],[21,0],[34,3],[41,10],[34,19],[20,20],[8,18]]){r(x,y,7,4,0xa6a88c);r(x,y+4,7,3,0x6f7965);}r(14,9,23,4,0x594b36);r(23,4,4,17,0x765736);});
      this.fire=this.add.graphics().setDepth(236);
      this.add.text(84,331,'ACAMPAMENTO',{fontFamily:'monospace',fontSize:'8px',color:'#f0e1af',backgroundColor:'#69553e',padding:{x:5,y:4}}).setDepth(337);
      this.add.text(320,401,'↓ JORNADA',{fontFamily:'monospace',fontSize:'8px',color:'#efe1b3'}).setOrigin(.5).setDepth(409);
    }
    makeRouteMap(){
      const g=this.add.graphics(),route=this.options.route,pal=route==='cave'?[0x655d66,0x8e8690,0x49454e]:route==='lake'?[0x75955c,0xceb987,0x4f91a1]:[0x719653,0xb9ad77,0x3f6947],r=(x,y,w,h,c)=>{g.fillStyle(c);g.fillRect(x,y,w,h);};r(0,0,640,416,pal[0]);for(let y=72;y<416;y+=16)for(let x=32;x<608;x+=16)if((x+y)%48===0)r(x,y,3,2,pal[2]);r(282,90,76,326,pal[1]);r(170,220,300,42,pal[1]);this.blockers=this.physics.add.staticGroup();for(const o of this.model.obstacles){r(o.x,o.y,o.w,o.h,pal[2]);r(o.x+8,o.y+8,o.w-16,8,pal[1]);const zone=this.add.zone(o.x+o.w/2,o.y+o.h/2,o.w,o.h);this.physics.add.existing(zone,true);this.blockers.add(zone);}this.add.text(320,155,'MARCO',{fontFamily:'monospace',fontSize:'10px',color:'#f1e3b3',backgroundColor:'#544638',padding:{x:6,y:4}}).setOrigin(.5);this.add.zone(320,155,70,38).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.blocked()&&this.player&&Math.hypot(this.player.x-320,this.player.y-185)<60){this.options.onDiscovery();}});this.add.text(320,395,'↓ CAMINHOS',{fontFamily:'monospace',fontSize:'10px',color:'#f1e3b3'}).setOrigin(.5);
    }
    makeCenterMap(){
      const g=this.add.graphics(),r=(x,y,w,h,c)=>{g.fillStyle(c);g.fillRect(x,y,w,h);};
      r(0,0,640,416,0xd7d3b3);
      for(let y=88;y<416;y+=24)for(let x=32;x<608;x+=24){r(x,y,24,24,((x/24+y/24)%2)?0xe9e3c2:0xe1dabb);r(x,y,24,1,0xc9c7a5);r(x,y,1,24,0xc9c7a5);}
      r(0,0,640,24,0x855b62);r(0,24,640,12,0xc78587);r(0,36,640,50,0xeee8cb);r(0,83,640,6,0x788267);
      r(0,88,36,328,0x789079);r(604,88,36,328,0x789079);r(0,400,281,16,0x697d69);r(359,400,281,16,0x697d69);
      for(const x of [82,480]){r(x,47,78,27,0x7c958a);r(x+4,50,70,20,0xb9d5c5);r(x+36,50,4,20,0x7c958a);}
      // Recovery counter, six Poké Balls and a machine at the back of the room.
      r(176,120,288,54,0x7b8b71);r(180,123,280,14,0xa5b192);r(180,139,280,28,0xddd7b7);r(184,167,272,5,0x8b8d70);
      r(388,99,52,24,0x677d75);r(392,102,44,15,0xb2d4bd);r(400,106,8,8,0xece5c1);r(411,106,8,8,0xc5867d);r(422,106,8,8,0xece5c1);
      for(let i=0;i<6;i++){const x=205+i*23;r(x,145,13,6,0xbd7777);r(x,151,13,6,0xeae2c0);r(x+5,150,3,3,0x5f6b5a);}
      // Original pixel receptionist, with white cap and uniform.
      r(308,74,24,13,0xd5b0a0);r(306,85,28,23,0xb76f7e);r(311,87,18,18,0xe5c1a0);r(313,95,3,2,0x544e45);r(325,95,3,2,0x544e45);
      r(307,73,26,8,0xf2edda);r(316,72,8,10,0xc78385);r(313,75,14,4,0xc78385);r(310,106,21,23,0xf2edda);r(315,109,11,16,0xe0cfc2);r(307,109,4,14,0xe5c1a0);r(331,109,4,14,0xe5c1a0);
      // PC terminal and plant pots are solid furniture.
      r(56,112,48,64,0x65786e);r(60,115,40,27,0xa3bcaa);r(65,120,30,17,0x68889a);r(66,123,16,2,0xb8d8c4);r(63,148,34,5,0xc2c6a8);r(65,159,30,13,0x8da18b);
      r(527,149,40,27,0xa88a68);r(531,150,32,22,0xb29c77);r(522,115,49,34,0x4f7652);r(531,107,32,17,0x749363);r(520,129,15,14,0x749363);
      // Exit mat is an actual walking exit.
      r(280,363,80,37,0xbb7d80);r(286,369,68,25,0xdfaaa0);r(314,378,12,4,0x705b58);r(318,381,4,9,0x705b58);
      g.generateTexture('center-ground',640,416);g.destroy();this.add.image(0,0,'center-ground').setOrigin(0);
      this.add.text(320,49,'CENTRO POKÉMON',{fontFamily:'monospace',fontSize:'12px',color:'#536650'}).setOrigin(.5);
      this.add.text(320,399,'↓ JORNADA',{fontFamily:'monospace',fontSize:'8px',color:'#f5e6c6'}).setOrigin(.5).setDepth(409);
      this.blockers=this.physics.add.staticGroup();this.model.obstacles.forEach(o=>{const z=this.add.zone(o.x+o.w/2,o.y+o.h/2,o.w,o.h);this.physics.add.existing(z,true);this.blockers.add(z);});
      this.add.zone(80,140,48,64).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.blocked()&&this.nearCenter('pc'))this.options.onPC();});
      this.add.zone(320,108,56,64).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.blocked()&&this.nearCenter('nurse'))this.options.onNurse();});
    }
    create(){
      this.makeMap();
      for(const m of this.options.team)if(m.asset.mode==='icon'){const key='mon-'+m.index,texture=this.textures.get(key),im=texture.getSourceImage();const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,im.width,im.height).data;let x0=im.width,y0=im.height,x1=0,y1=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(pixels[(y*im.width+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1>=x0&&y1>=y0){texture.add('visible',0,x0,y0,x1-x0+1,y1-y0+1);m.visible=true;}}
      if(!this.textures.exists('trainer')||this.options.team.some(m=>!this.textures.exists('mon-'+m.index))){this.options.onError('Um sprite não carregou. Volte à jornada e abra o acampamento novamente.');return;}
      const p=this.model.safePosition(this.options.position);this.direction=p.dir;
      this.player=this.physics.add.sprite(p.x,p.y,'trainer').setOrigin(.5,1).setScale(1.2);
      this.player.body.setSize(12,8).setOffset(10,40);this.player.setCollideWorldBounds(true);
      this.physics.world.setBounds(this.model.bounds.x,this.model.bounds.y,this.model.bounds.w,this.model.bounds.h);
      this.physics.add.collider(this.player,this.blockers);
      this.monsters=this.physics.add.group();
      this.options.team.forEach((m,n)=>{
        const [x,y]=this.model.spots[n%6],sprite=this.physics.add.sprite(x,y,'mon-'+m.index).setOrigin(.5,1).setDepth(y);
        sprite.setData('member',m);sprite.setData('home',{x,y});sprite.setData('direction','down');sprite.setData('nextWander',this.time.now+1000+n*650);
        if(m.asset.mode==='walk')sprite.setScale(1.1).body.setSize(12,8).setOffset(10,38);
        else {if(m.visible)sprite.setFrame('visible');const frame=sprite.frame;const scale=28/Math.max(frame.width,frame.height);sprite.setDisplaySize(frame.width*scale,frame.height*scale);sprite.body.setSize(sprite.width*.4,sprite.height*.2).setOffset(sprite.width*.3,sprite.height*.77);}
        sprite.setCollideWorldBounds(true).setInteractive({useHandCursor:true});
        sprite.on('pointerdown',()=>this.options.onSelect(m.index));
        this.monsters.add(sprite);
        this.animate(sprite,'down',false);
      });
      this.physics.add.collider(this.monsters,this.blockers);this.physics.add.collider(this.player,this.monsters);this.physics.add.collider(this.monsters,this.monsters);
      this.animate(this.player,this.direction,false);
      this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ESC',false);
      this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT');
      // Phaser may process the same queued DOM event again before its next frame.
      // An action key must close/open a panel only once per physical press.
      this.input.keyboard.on('keydown-E',event=>{if(this.handledKeys.has(event))return;this.handledKeys.add(event);if(!this.blocked())this.nearest();});
      this.input.keyboard.on('keydown-ESC',event=>{if(this.handledKeys.has(event))return;this.handledKeys.add(event);if(event.repeat||event.defaultPrevented||document.querySelector('.profile-panel')||playlistOpen)return;this.options.onEscape();});
      this.input.on('pointerdown',pointer=>{if(this.blocked()||pointer.worldY<65)return;if(!this.monsters.getChildren().some(m=>m.getBounds().contains(pointer.worldX,pointer.worldY))){const p=this.model.safePosition({x:pointer.worldX,y:pointer.worldY});if(Math.abs(p.x-pointer.worldX)<1&&Math.abs(p.y-pointer.worldY)<1)this.target=p;}});
      this.blur=()=>{this.target=null;this.input.keyboard.resetKeys();if(this.player?.body)this.player.setVelocity(0);this.savePosition();};
      window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.blur);
      this.events.once('shutdown',()=>{this.savePosition();window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.blur);});
      if(this.options.hosted)this.hostedSetup();
      this.options.onReady();
    }
    // Inside the main game: the camera follows the trainer over the 640x416 map, text is drawn at the
    // game's render scale, and Z/Enter/Space interact while X/Backspace open the menu (like E and Esc).
    hostedSetup(){
      this.cameras.main.setBounds(0,0,C.WIDTH,C.HEIGHT).startFollow(this.player,true,.2,.2);
      const scale=this.game.registry.get('renderScale')||1;this.children.list.filter(o=>o.type==='Text').forEach(t=>t.setResolution(scale));
      const once=(name,fn)=>this.input.keyboard.on(name,event=>{if(this.handledKeys.has(event)||event.repeat)return;this.handledKeys.add(event);fn();});
      for(const k of ['Z','ENTER','SPACE'])once('keydown-'+k,()=>{if(!this.blocked())this.nearest();});
      for(const k of ['X','BACKSPACE'])once('keydown-'+k,()=>{if(!this.blocked())this.options.onEscape();});
    }
    blocked(){return this.options.isBlocked()||document.hidden||document.activeElement?.matches('input,select,textarea,button')&&document.activeElement.closest('.profile-panel');}
    animate(sprite,dir,moving){
      const member=sprite.getData('member');if(member?.asset.mode==='icon')return;
      const key=sprite.texture.key,columns=member?2:4,row=['down','up','left','right'].indexOf(dir),anim=key+'-'+dir;
      if(!this.anims.exists(anim))this.anims.create({key:anim,frames:this.anims.generateFrameNumbers(key,{start:row*columns,end:row*columns+columns-1}),frameRate:member?5:9,repeat:-1});
      if(moving)sprite.play(anim,true);else{sprite.anims.stop();sprite.setFrame(row*columns);}
    }
    nearCenter(kind){return !!this.player&&Phaser.Math.Distance.Between(this.player.x,this.player.y,kind==='pc'?80:320,kind==='pc'?172:174)<58;}
    nearest(){
      if(this.options.kind==='route'){if(Math.hypot(this.player.x-320,this.player.y-185)<60)this.options.onDiscovery();else this.options.onHint('Aproxime-se do marco para observar.');return;}
      if(this.options.kind==='center'&&this.nearCenter('pc')){this.options.onPC();return;}
      if(this.options.kind==='center'&&this.nearCenter('nurse')){this.options.onNurse();return;}
      const choices=this.monsters.getChildren().map(sprite=>({sprite,d:Phaser.Math.Distance.Between(this.player.x,this.player.y,sprite.x,sprite.y)})).sort((a,b)=>a.d-b.d);
      if(choices[0]?.d<65)this.options.onSelect(choices[0].sprite.getData('member').index);
      else this.options.onHint('Aproxime-se de um Pokémon ou clique nele para conversar.');
    }
    savePosition(){if(this.player)this.options.onPosition({x:this.player.x,y:this.player.y,dir:this.direction});}
    update(time,delta){
      if(!this.player?.body||!this.keys||!this.monsters)return;
      const blocked=this.blocked();let x=0,y=0;if(blocked){this.target=null;this.input.keyboard.disableGlobalCapture();}else this.input.keyboard.enableGlobalCapture();
      if(!blocked){
        x=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown);
        y=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);
        const touch=this.options.touch();if(touch){x=touch.x;y=touch.y;}
        if(x||y)this.target=null;
        else if(this.target){const dx=this.target.x-this.player.x,dy=this.target.y-this.player.y;if(Math.hypot(dx,dy)<5)this.target=null;else{x=dx;y=dy;}}
      }
      const len=Math.hypot(x,y);if(len){x/=len;y/=len;this.direction=Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up';}
      this.player.setVelocity(x*95,y*95).setDepth(this.player.y);this.animate(this.player,this.direction,!!len);
      if(this.target&&(this.player.body.blocked.left||this.player.body.blocked.right||this.player.body.blocked.up||this.player.body.blocked.down))this.target=null;
      this.monsters.getChildren().forEach(sprite=>{
        if(!sprite?.body)return;
        sprite.setDepth(sprite.y);
        if(blocked){sprite.setVelocity(0);return;}
        if(time>sprite.getData('nextWander')){
          const home=sprite.getData('home'),angle=Phaser.Math.Angle.Between(sprite.x,sprite.y,home.x,home.y)+(Math.random()-.5)*3;
          const wander=Math.random()>.35,dir=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?Math.cos(angle)>0?'right':'left':Math.sin(angle)>0?'down':'up';
          sprite.setVelocity(wander?Math.cos(angle)*15:0,wander?Math.sin(angle)*15:0);sprite.setData('direction',dir);sprite.setData('nextWander',time+1200+Math.random()*2200);this.animate(sprite,dir,wander);
        }
        if(sprite.getData('member').asset.mode==='icon')sprite.setAngle(Math.sin(time/500+sprite.x)*3);
      });
      if(this.options.kind==='center'&&!blocked&&!this.exiting&&this.player.y>382&&Math.abs(this.player.x-320)<38){this.exiting=true;this.options.onExit();return;}
      if(this.fire){this.fire.clear();this.fire.fillStyle(0xda9252);this.fire.fillTriangle(310,230,329,230,321+Math.sin(time/170)*2,205);this.fire.fillStyle(0xe8bc69);this.fire.fillTriangle(315,230,326,230,320,214+Math.sin(time/140)*3);}
      if(time-this.lastSave>4000){this.savePosition();this.lastSave=time;}
    }
    emote(index){
      const m=this.monsters.getChildren().find(x=>x.getData('member').index===index);if(!m)return;
      const heart=this.add.text(m.x,m.y-40,'♥',{fontFamily:'monospace',fontSize:'16px',color:'#efbc96',stroke:'#6a4d3d',strokeThickness:2,resolution:this.game.registry.get('renderScale')||1}).setOrigin(.5).setDepth(1000);
      this.tweens.add({targets:heart,y:heart.y-18,alpha:0,duration:1200,onComplete:()=>heart.destroy()});
    }
  }
  let instance=null,scene=null;
  window.CampWorld={
    start(options){this.destroy();scene=new CampScene();scene.options=options;
      // With the game engine running, the world is a scene of the main game (no second canvas).
      if(window.GameEngine?.enabled){options.hosted=true;instance='engine';GameEngine.hostWorld(scene);return;}
      instance=new Phaser.Game({type:Phaser.CANVAS,parent:options.parent||'camp-canvas',width:C.WIDTH,height:C.HEIGHT,pixelArt:true,roundPixels:true,backgroundColor:'#729653',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},audio:{noAudio:true},loader:{imageLoadType:'HTMLImageElement',crossOrigin:null},scene});},
    destroy(){if(instance){scene.savePosition();if(instance==='engine')GameEngine.removeWorld(scene);else instance.destroy(true);instance=null;scene=null;}},
    emote(index){scene?.emote(index);},
    position(){return scene?.player?{x:scene.player.x,y:scene.player.y,dir:scene.direction}:null;},
    debug(){return {game:instance,scene};}
  };
})();
