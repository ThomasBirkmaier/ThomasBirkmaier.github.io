(function(){
  var still=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function each(list,fn){Array.prototype.forEach.call(list,fn)}
  function whenSeen(el,share,fn){
    if(!("IntersectionObserver" in window)){fn();return}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn()}})},{threshold:share});
    io.observe(el);
  }
  // A clock that only moves while the page is shown, so nothing jumps after a pause.
  function clock(tick){
    var last=0,t=0,on=false;
    function frame(now){if(!on)return;t+=Math.min(now-last,80);last=now;if(tick(t)!==false)requestAnimationFrame(frame);else on=false}
    return {start:function(){t=0;last=performance.now();if(!on){on=true;requestAnimationFrame(frame)}},stop:function(){on=false}};
  }

  // The stage: fifteen small steps in seven chapters. Each step is a complete state, so any chapter can be shown directly.
  (function(){
    var stage=document.getElementById("stage"),parts=stage.querySelectorAll("[data-from]"),segs=stage.querySelectorAll(".seg i");
    // 30 % slower than the first cut, so each change can be followed.
    var slow=1.3,at=[0,250,1900,2300,4500,5200,6900,7600,8200,8800,10900,11700,13400,14200,16100,16900].map(function(v){return Math.round(v*slow)}),end=Math.round(19000*slow);
    var chapterOf=[0,1,2,2,3,3,4,4,4,4,5,5,6,6,7,7],chapterStart=[at[1],at[2],at[4],at[6],at[10],at[12],at[14],end],chapterEnd=[1,3,5,9,11,13,15];
    var pulses={2:[".l-1"],5:[".l-2"],6:[".l-3"],8:[".l-3"],14:[".l-3"]},pings={10:".n-need",11:".n-sr amber",12:".n-sr",13:".n-ev amber",15:".n-ev"};
    function show(s){
      var d=stage.dataset,old=s===13||s===14;
      d.ch=chapterOf[s];
      d.need=s>=15?3:s>=10?2:1;
      d.sr=s>=15?3:s>=12?2:1;
      d.rel=s===11?"old":"ok";
      d.keys=s>=5&&s<=8?1:0;
      d.t1=s>=6?1:0; d.t2=s>=8?1:0;
      d.c1=old?"old":s>=7?"ok":"open";
      d.c2=old?"old":s>=9?"ok":"open";
      d.count=old?0:s>=9?2:s>=7?1:0;
      d.ver=old?"old":s>=9?"ok":"open";
      d.build=s>=14?2:1;
      each(parts,function(p){p.classList.toggle("on",s>=+p.dataset.from)});
      focusOn(s);
    }
    // Where to look: the part that just changed is lifted and ringed, the rest steps back a little.
    var focus={1:[".n-need"],2:[".l-1"],3:[".n-sr"],4:[".l-2",".n-tests"],5:[".n-sr .crit",".n-tests"],6:[".n-tests .t1",".l-3",".n-ev"],7:[".n-sr .c1",".n-ev"],8:[".n-tests .t2"],9:[".n-sr .c2",".n-ev"],10:[".n-need"],11:[".l-1"],12:[".n-sr"],13:[".l-3",".n-ev"],14:[".n-tests",".l-3"],15:[".n-ev"]};
    function focusOn(s){
      each(stage.querySelectorAll(".focus"),function(el){el.classList.remove("focus")});
      var sel=focusing?focus[s]:null;
      stage.classList.toggle("focusing",!!sel);
      (sel||[]).forEach(function(q){each(stage.querySelectorAll(q),function(el){el.classList.add("focus");var n=el.closest(".node");if(n)n.classList.add("focus")})});
    }
    var focusing=false;
    function fill(t){each(segs,function(i,k){var a=chapterStart[k],b=chapterStart[k+1];i.style.transform="scaleX("+Math.max(0,Math.min(1,(t-a)/(b-a)))+")"})}
    function pulse(sel){var l=stage.querySelector(sel);l.classList.remove("go");void l.offsetWidth;l.classList.add("go")}
    function ping(what){var w=what.split(" "),n=stage.querySelector(w[0]);n.classList.remove("ping","amber");void n.offsetWidth;n.classList.add("ping");if(w[1])n.classList.add(w[1])}
    var step=0,run=clock(function(t){
      while(step<15&&t>=at[step+1]){step++;show(step);(pulses[step]||[]).forEach(pulse);if(pings[step])ping(pings[step])}
      fill(t);
      if(t>=end){focusing=false;focusOn(15);idle();return false}
      return true;
    });
    // After the story: a quiet flow along the chain, from the need to the evidence, while the stage is in view.
    var seen=false,flowing=null;
    if("IntersectionObserver" in window){new IntersectionObserver(function(es){seen=es[0].isIntersecting},{threshold:.2}).observe(stage)}
    function flow(){
      if(!seen||document.hidden)return;
      [".l-1",".l-2",".l-3"].forEach(function(sel,k){setTimeout(function(){var l=stage.querySelector(sel);l.classList.remove("flow");void l.offsetWidth;l.classList.add("flow")},k*650)});
    }
    function idle(){if(!flowing&&!still){flowing=setInterval(flow,5200);setTimeout(flow,1600)}}
    function play(){focusing=true;step=0;show(0);fill(0);run.start()}
    each(stage.querySelectorAll(".seg"),function(b,k){b.addEventListener("click",function(){
      run.stop();focusing=true;step=chapterEnd[k];show(step);fill(chapterStart[k+1]);
    })});
    document.getElementById("stage-replay").addEventListener("click",play);
    if(still){stage.classList.add("still");show(15);fill(end)}
    else{show(0);whenSeen(stage,.45,play)}
  })();

  // Played sessions: the parts appear in the order of the page, a typed part letter by letter.
  each(document.querySelectorAll(".player"),function(root){
    var speed=17,t=0,cues=[];
    each(root.querySelectorAll("[data-d]"),function(el){
      t+=+el.dataset.d;
      var cue={el:el,at:t,phase:el.dataset.phase,chars:null,n:0};
      if(el.classList.contains("type")){
        cue.chars=[];
        var walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[],n;
        while((n=walk.nextNode()))nodes.push(n);
        nodes.forEach(function(node){
          var frag=document.createDocumentFragment();
          node.nodeValue.split("").forEach(function(c){var s=document.createElement("span");s.className="ch";s.textContent=c;frag.appendChild(s);cue.chars.push(s)});
          node.parentNode.replaceChild(frag,node);
        });
        t+=cue.chars.length*speed;
      }
      cues.push(cue);
    });
    var total=t+1400;
    function reset(){root.dataset.phase=0;cues.forEach(function(c){c.el.classList.remove("on");c.n=0;if(c.chars)c.chars.forEach(function(s){s.className="ch"})})}
    function finish(){root.dataset.phase=0;cues.forEach(function(c){c.el.classList.add("on");if(c.chars)c.chars.forEach(function(s){s.className="ch on"})})}
    var run=clock(function(now){
      cues.forEach(function(c){
        if(now<c.at)return;
        if(!c.el.classList.contains("on")){c.el.classList.add("on");if(c.phase)root.dataset.phase=c.phase}
        if(c.chars&&c.n<c.chars.length){
          var want=Math.min(c.chars.length,Math.floor((now-c.at)/speed)+1);
          for(;c.n<want;c.n++){c.chars[c.n].className="ch on"}
          if(c.n>1)c.chars[c.n-2].className="ch on";
          c.chars[c.n-1].className=c.n<c.chars.length?"ch on cur":"ch on";
        }
      });
      if(now>=total){root.dataset.phase=0;return false}
    });
    var again=root.querySelector(".replay");
    again.addEventListener("click",function(){reset();run.start()});
    if(still){again.hidden=true;finish()}
    else{reset();whenSeen(root.querySelector(".session"),.35,function(){run.start()})}
  });

  // Content rises into place as it enters the view, siblings one after another.
  if(!still&&"IntersectionObserver" in window){
    var groups=["main section h2","main section .lead",".more>div",".pillar",".nevers>*",".ways>*",".tabs",".session","section[aria-labelledby=h-start] .sheet","section .own .frame","#p-overview .frame","main section .body>p","main section .head>a","main section .head>p:not(.lead)"];
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.12});
    groups.forEach(function(sel){each(document.querySelectorAll(sel),function(el){
      if(el.closest(".stage")||el.classList.contains("rise"))return;
      var i=0,sib=el;while((sib=sib.previousElementSibling))if(sib.matches(sel))i++;
      el.classList.add("rise");el.style.setProperty("--i",Math.min(i,6));io.observe(el);
    })});
  }

  // The pages of the web UI: one frame, five pages.
  var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));
  function open(tab,focus){
    tabs.forEach(function(t){
      var on=t===tab;
      t.setAttribute("aria-selected",on?"true":"false");
      t.tabIndex=on?0:-1;
      document.getElementById(t.getAttribute("aria-controls")).hidden=!on;
    });
    if(focus)tab.focus();
  }
  tabs.forEach(function(t,i){
    t.addEventListener("click",function(){open(t)});
    t.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight")open(tabs[(i+1)%tabs.length],true);
      else if(e.key==="ArrowLeft")open(tabs[(i+tabs.length-1)%tabs.length],true);
    });
  });
  open(tabs[0]);
})();
