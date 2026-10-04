(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.set('.hero-badge,.hero-title,.hero-lead,.hero-actions,.proof-row', {opacity:0,y:22});
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero-badge',{opacity:1,y:0,duration:.55})
    .to('.hero-title',{opacity:1,y:0,duration:.85},'-=.25')
    .to('.hero-lead',{opacity:1,y:0,duration:.65},'-=.45')
    .to('.hero-actions',{opacity:1,y:0,duration:.55},'-=.35')
    .to('.proof-row',{opacity:1,y:0,duration:.5},'-=.25');

  gsap.from('.route-stage',{opacity:0,scale:.96,y:24,duration:1,ease:'power3.out',delay:.2});
  gsap.to('.route-main',{strokeDashoffset:0,duration:2.1,ease:'power2.inOut',delay:.65});
  gsap.from('.node',{opacity:0,scale:.35,transformOrigin:'center',stagger:.18,duration:.5,ease:'back.out(1.7)',delay:1.1});
  gsap.from('.floating-card',{opacity:0,y:18,scale:.94,stagger:.16,duration:.65,ease:'power3.out',delay:1.25});

  const route = gsap.timeline({repeat:-1,repeatDelay:.6,delay:2.3});
  route.to('.signal-a',{attr:{cx:286,cy:266},duration:1.1,ease:'sine.inOut'})
       .to('.signal-a',{attr:{cx:510,cy:300},duration:1.05,ease:'sine.inOut'})
       .to('.signal-a',{attr:{cx:680,cy:112},duration:1.25,ease:'sine.inOut'})
       .set('.signal-a',{attr:{cx:92,cy:392}});
  gsap.to('.signal-b',{opacity:.2,scale:1.8,transformOrigin:'center',duration:1.1,yoyo:true,repeat:-1,ease:'sine.inOut'});

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 88%',once:true},opacity:0,y:34,duration:.72,ease:'power3.out'});
  });

  gsap.to('.ambient-a',{x:-80,y:70,duration:9,yoyo:true,repeat:-1,ease:'sine.inOut'});
  gsap.to('.ambient-b',{x:90,y:-55,duration:11,yoyo:true,repeat:-1,ease:'sine.inOut'});
})();
