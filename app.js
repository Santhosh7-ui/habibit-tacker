const QUOTES=[
  {t:"We are what we repeatedly do. Excellence is not an act, but a habit.",a:"Aristotle"},
  {t:"Motivation gets you started. Habit keeps you going.",a:"Jim Ryun"},
  {t:"Small daily improvements are the key to staggering long-term results.",a:"Robin Sharma"},
  {t:"Your future is created by what you do today, not tomorrow.",a:"Robert Kiyosaki"},
  {t:"Success is the sum of small efforts, repeated day in and day out.",a:"Robert Collier"},
  {t:"The secret of your future is hidden in your daily routine.",a:"Mike Murdock"},
  {t:"Discipline is choosing between what you want now and what you want most.",a:"Augusta F. Kantra"},
  {t:"You don't rise to the level of your goals. You fall to the level of your systems.",a:"James Clear"},
  {t:"An ounce of practice is worth more than tons of preaching.",a:"Mahatma Gandhi"},
  {t:"First forget inspiration. Habit is more dependable.",a:"Octavia Butler"}
];
const EMOJIS=['🧘','🏃','📚','💧','🥗','🏋️','😴','✍️','🎯','🧠','💊','🌞','🎵','🚴','🫁','🧹','🎨','🌿'];
const COLORS=['#6C63FF','#FF6584','#43C59E','#F59E0B','#3B82F6','#EF4444','#8B5CF6','#10B981','#F97316','#EC4899'];

let habits=[], selEmoji=EMOJIS[0], selColor=COLORS[0], currentView='today', currentHabitId=null, detailHabit=null;
let charts={trend:null, weekly:null, rate:null, comp:null, dist:null};

function dk(d){return d.toISOString().slice(0,10)}
function todayKey(){return dk(new Date())}

async function load(){
  try{ const r = localStorage.getItem('hf_data'); if(r) habits = JSON.parse(r); } catch(e){ habits=[]; }
}
async function save(){ localStorage.setItem('hf_data', JSON.stringify(habits)); }

function showToast(msg) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
  c.appendChild(t); setTimeout(()=>t.remove(), 3000);
}

async function fetchQuote() {
  const qt = document.getElementById('q-text'), qa = document.getElementById('q-author');
  qt.classList.add('fade'); qa.classList.add('fade');
  setTimeout(async () => {
    try {
      const res = await fetch('https://api.quotable.io/random?tags=technology,famous-quotes,wisdom');
      if(!res.ok) throw new Error();
      const data = await res.json();
      qt.textContent = data.content; qa.textContent = '— ' + data.author;
    } catch(e) {
      const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
      qt.textContent = q.t; qa.textContent = '— ' + q.a;
    }
    qt.classList.remove('fade'); qa.classList.remove('fade');
  }, 400);
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show');document.getElementById('hamburger').classList.toggle('open')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show');document.getElementById('hamburger').classList.remove('open')}

function navigate(view, hid){
  currentView=view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.sidebar-nav a').forEach(a=>a.classList.remove('active'));
  const ne=document.getElementById('nav-'+view); if(ne) ne.classList.add('active');
  
  if(view==='detail'&&hid){
    currentHabitId=hid; detailHabit=habits.find(h=>h.id===hid);
    document.getElementById('topbar-title').textContent=detailHabit?detailHabit.name:'Detail';
    renderDetail(detailHabit);
  } else {
    document.getElementById('topbar-title').textContent = {today:'HabitFlow',analytics:'Analytics',settings:'Settings'}[view]||'';
  }
  if(view==='analytics') renderAnalytics();
  if(view==='today') renderToday();
  closeSidebar();
}

function buildEmojiPicker(){const c=document.getElementById('emoji-picker');c.innerHTML='';EMOJIS.forEach(e=>{const d=document.createElement('span');d.className='emoji-opt'+(e===selEmoji?' sel':'');d.textContent=e;d.onclick=()=>{selEmoji=e;buildEmojiPicker()};c.appendChild(d)})}
function buildColorPicker(){const c=document.getElementById('color-picker');c.innerHTML='';COLORS.forEach(col=>{const d=document.createElement('div');d.className='color-opt'+(col===selColor?' sel':'');d.style.background=col;d.onclick=()=>{selColor=col;buildColorPicker()};c.appendChild(d)})}
function showModal(){buildEmojiPicker();buildColorPicker();document.getElementById('modal').style.display='flex';setTimeout(()=>document.getElementById('habit-name-input').focus(),100)}
function hideModal(){document.getElementById('modal').style.display='none'}

async function addHabit(){
  const name=document.getElementById('habit-name-input').value.trim();if(!name)return;
  habits.push({id:Date.now()+'',name,emoji:selEmoji,color:selColor,completions:{}});
  await save();hideModal();renderToday();renderSidebar();showToast('✨ Habit created');
  document.getElementById('habit-name-input').value = '';
}
async function deleteHabit(id, el){
  if(!confirm('Delete habit?'))return;
  if(el){ el.classList.add('removing'); await new Promise(r=>setTimeout(r,400)); }
  habits=habits.filter(h=>h.id!==id);await save();renderToday();renderSidebar();
  if(currentView==='detail') navigate('today');
  showToast('🗑️ Habit deleted');
}
async function toggleToday(id, ev){
  if(ev) ev.stopPropagation();
  const h=habits.find(x=>x.id===id);if(!h)return;
  const k=todayKey();h.completions[k]=!h.completions[k];
  await save();renderToday();renderSidebar();
  if(h.completions[k]) {
    showToast('🎉 Completed '+h.name);
    if(ev) createConfetti(ev.clientX, ev.clientY);
  }
}

function createConfetti(x, y) {
  for(let i=0;i<15;i++){
    const c = document.createElement('div'); c.className='confetti';
    c.style.left = x+'px'; c.style.top = y+'px';
    c.style.background = COLORS[Math.floor(Math.random()*COLORS.length)];
    c.style.transform = `translate(${(Math.random()-0.5)*100}px, ${(Math.random()-0.5)*100}px)`;
    document.body.appendChild(c); setTimeout(()=>c.remove(), 600);
  }
}

function calcStreak(h){let s=0,d=new Date();while(true){if(h.completions[dk(d)]){s++;d.setDate(d.getDate()-1)}else break}return s}
function calcLongest(h){const keys=Object.keys(h.completions).filter(k=>h.completions[k]).sort();if(!keys.length)return 0;let mx=1,cur=1;for(let i=1;i<keys.length;i++){const diff=(new Date(keys[i])-new Date(keys[i-1]))/864e5;if(diff===1){cur++;mx=Math.max(mx,cur)}else cur=1}return mx}
function rate30(h){let d=0,dd=new Date();for(let i=0;i<30;i++){if(h.completions[dk(dd)])d++;dd.setDate(dd.getDate()-1)}return Math.round((d/30)*100)}

function renderSidebar(){
  const ul=document.getElementById('sidebar-habits');ul.innerHTML='';
  if(!habits.length){ul.innerHTML='<li style="color:var(--muted);font-size:13px;padding:8px 14px">No habits yet</li>';return}
  habits.forEach(h=>{
    const li=document.createElement('li');li.className='sh-item'+(currentHabitId===h.id&&currentView==='detail'?' active':'');
    li.style.setProperty('--hc',h.color);
    li.innerHTML=`<span class="habit-dot" style="background:${h.color}"></span><span style="flex:1">${h.emoji} ${h.name}</span><span class="sh-streak">🔥${calcStreak(h)}</span>`;
    li.onclick=()=>navigate('detail',h.id);ul.appendChild(li);
  });
}

function renderToday(){
  const tot=habits.length,done=habits.filter(h=>h.completions[todayKey()]).length;
  const streaks=habits.map(h=>calcStreak(h)),best=streaks.length?Math.max(...streaks):0;
  const totalComp=habits.reduce((a,h)=>a+Object.values(h.completions).filter(Boolean).length,0);
  document.getElementById('stat-grid').innerHTML=`
    <div class="stat-card c1"><div class="stat-label">Today</div><div class="stat-val">${done}/${tot}</div><div class="stat-sub">done</div></div>
    <div class="stat-card c2"><div class="stat-label">Best streak</div><div class="stat-val">🔥${best}</div><div class="stat-sub">days</div></div>
    <div class="stat-card c3"><div class="stat-label">All time</div><div class="stat-val">${totalComp}</div><div class="stat-sub">completions</div></div>
    <div class="stat-card c4"><div class="stat-label">Today rate</div><div class="stat-val">${tot?Math.round((done/tot)*100):0}%</div><div class="stat-sub">completion</div></div>
  `;
  const list=document.getElementById('today-list');list.innerHTML='';
  if(!habits.length){list.innerHTML=`<div class="empty"><div class="empty-icon">🌱</div><p style="font-size:14px;line-height:1.7">No habits yet.<br>Tap <b>+ Add</b> to get started!</p></div>`;return}
  habits.forEach((h,i)=>{
    const k=todayKey(),isDone=h.completions[k]||false,streak=calcStreak(h),r=rate30(h);
    const card=document.createElement('div');card.className='habit-card'+(isDone?' completed':'');card.style.animationDelay=(i*.08)+'s';
    card.innerHTML=`
      <div class="habit-check ${isDone?'done':''}" style="${isDone?'background:'+h.color+';box-shadow:0 0 10px '+h.color+'44':''}" onclick="toggleToday('${h.id}', event)">
        <svg viewBox="0 0 14 14" fill="none" stroke="${isDone?'#fff':'#ccc'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,7 6,11 12,3"/></svg>
      </div>
      <div class="habit-info">
        <div class="habit-name">${h.emoji} ${h.name}</div>
        <div class="habit-meta">30d rate: ${r}% · Longest: ${calcLongest(h)}d</div>
      </div>
      <div class="habit-streak-area">
        <div class="habit-streak" style="color:${h.color}">${streak>0?'🔥'+streak:''}</div>
        <div class="habit-streak-lbl">${streak>0?'day streak':''}</div>
      </div>
      <button class="del-btn" onclick="event.stopPropagation();deleteHabit('${h.id}', this.parentElement)">✕</button>
      <div class="progress-bar"><div class="progress-fill" style="width:${r}%;background:${h.color}"></div></div>
    `;
    card.onclick=()=>navigate('detail',h.id);list.appendChild(card);
  });
}

function buildHeatmap(h,container){
  container.innerHTML='';const weeks=53,end=new Date(),start=new Date(end);
  start.setDate(start.getDate()-weeks*7+1);
  const grid=document.createElement('div');grid.className='heatmap';
  const monthsSeen={};
  for(let w=0;w<weeks;w++){
    const col=document.createElement('div');col.className='hm-col';
    for(let day=0;day<7;day++){
      const d=new Date(start);d.setDate(d.getDate()+w*7+day);
      const k=dk(d),done=h.completions[k];
      const cell=document.createElement('div');cell.className='hm-cell';
      cell.style.background=done?h.color:'var(--border)';cell.style.opacity=done?'1':'0.3';
      cell.title=k+(done?' ✓':'');col.appendChild(cell);
      if(day===0){const mo=d.toLocaleString('default',{month:'short'});if(!monthsSeen[mo]){monthsSeen[mo]=w}}
    }
    grid.appendChild(col);
  }
  const leg=document.createElement('div');leg.style.cssText='display:flex;align-items:center;gap:8px;margin-top:12px;font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em';
  leg.innerHTML=`Less <span style="width:12px;height:12px;border-radius:3px;background:var(--border);opacity:.4;display:inline-block"></span><span style="width:12px;height:12px;border-radius:3px;background:${h.color};opacity:.4;display:inline-block"></span><span style="width:12px;height:12px;border-radius:3px;background:${h.color};display:inline-block;box-shadow:0 0 6px ${h.color}66"></span> More`;
  container.appendChild(grid);container.appendChild(leg);
}

function destroyChart(k){if(charts[k]){try{charts[k].destroy()}catch(e){}charts[k]=null}}

function get30Labels(h){
  const labels=[],data=[];
  for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);labels.push(d.toLocaleDateString('default',{month:'short',day:'numeric'}));data.push(h.completions[dk(d)]?1:0)}
  return{labels,data};
}
function getWeekData(h){
  const labels=[],data=[];
  for(let w=7;w>=0;w--){let c=0;for(let d=0;d<7;d++){const dd=new Date();dd.setDate(dd.getDate()-w*7-d);if(h.completions[dk(dd)])c++}labels.push('W-'+w);data.push(c)}
  return{labels,data};
}

function switchTrendChart(){if(detailHabit)buildTrendChart(detailHabit)}
function switchWeeklyChart(){if(detailHabit)buildWeeklyChart(detailHabit)}
function switchRateChart(){if(detailHabit)buildRateChart(detailHabit)}
function switchCompChart(){renderAnalytics()}
function switchDistChart(){renderAnalytics()}

function buildTrendChart(h){
  destroyChart('trend');
  const {labels,data}=get30Labels(h);
  const type=document.getElementById('trend-select').value;
  let chartType = type;
  if(type==='area' || type==='stepped') chartType='line';
  
  const cfg={type:chartType,data:{labels,datasets:[{data,borderColor:h.color,backgroundColor:type==='area'?h.color+'22':type==='bar'?h.color+'dd':h.color+'22',fill:type==='area',tension:type==='stepped'?0:0.4,stepped:type==='stepped',pointRadius:type==='scatter'?4:0,borderWidth:2,borderSkipped:false,borderRadius:type==='bar'?4:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(0,0,0,0.8)',titleFont:{family:'Inter'},bodyFont:{family:'Inter'},padding:10,cornerRadius:8,displayColors:false}},scales:{x:{ticks:{maxTicksLimit:6,font:{size:10,family:'Inter'}},grid:{display:false}},y:{min:0,max:1,ticks:{stepSize:1,font:{size:10,family:'Inter'}},grid:{color:'rgba(128,128,128,.1)'}}}}};
  charts.trend=new Chart(document.getElementById('trendChart'),cfg);
}

function buildWeeklyChart(h){
  destroyChart('weekly');
  const {labels,data}=getWeekData(h);
  const type=document.getElementById('weekly-select').value;
  const isRadar=type==='radar', isPolar=type==='polarArea';
  const cfg={type,data:{labels,datasets:[{label:'Days done',data,backgroundColor:isRadar||isPolar?h.color+'33':h.color+'dd',borderColor:h.color,borderWidth:2,borderRadius:type==='bar'?6:0,pointRadius:isRadar?4:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:isRadar||isPolar?{r:{beginAtZero:true,max:7,ticks:{stepSize:1,font:{size:9,family:'Inter'}}}}:{x:{grid:{display:false},ticks:{font:{size:10,family:'Inter'}}},y:{max:7,ticks:{stepSize:1,font:{size:10,family:'Inter'}},grid:{color:'rgba(128,128,128,.1)'}}}}};
  charts.weekly=new Chart(document.getElementById('weeklyChart'),cfg);
}

function buildRateChart(h){
  destroyChart('rate');
  const r=rate30(h),left=100-r;
  const type=document.getElementById('rate-select').value;
  const cfg={type,data:{labels:['Completed','Missed'],datasets:[{data:[r,left],backgroundColor:[h.color,'rgba(128,128,128,.15)'],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:type==='doughnut'?'75%':undefined}};
  charts.rate=new Chart(document.getElementById('rateChart'),cfg);
  document.getElementById('rate-legend').innerHTML=`<div style="font-size:32px;font-weight:800;letter-spacing:-0.03em;color:${h.color}">${r}%</div><div style="color:var(--muted);font-size:12px;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">30-day rate</div><div style="font-size:13px;color:var(--text);margin-top:8px;font-weight:500">${r>=80?'🔥 Excellent!':r>=50?'👍 Good pace':'💪 Keep going!'}</div>`;
}

function renderDetail(h){
  if(!h)return;
  const hero=document.getElementById('d-hero');
  hero.style.background=`linear-gradient(135deg,${h.color},${h.color}dd)`;
  hero.style.boxShadow=`0 10px 30px ${h.color}44`;
  document.getElementById('d-icon').textContent=h.emoji;
  document.getElementById('d-name').textContent=h.name;
  const total=Object.values(h.completions).filter(Boolean).length;
  document.getElementById('d-tagline').textContent=`${total} total check-ins`;
  const streak=calcStreak(h),longest=calcLongest(h),r=rate30(h);
  document.getElementById('d-stats').innerHTML=`
    <div class="stat-card c1"><div class="stat-label">Current streak</div><div class="stat-val">🔥${streak}</div><div class="stat-sub">days</div></div>
    <div class="stat-card c2"><div class="stat-label">Longest</div><div class="stat-val">${longest}</div><div class="stat-sub">days</div></div>
    <div class="stat-card c3"><div class="stat-label">30-day rate</div><div class="stat-val">${r}%</div><div class="stat-sub">&nbsp;</div></div>
    <div class="stat-card c4"><div class="stat-label">Total</div><div class="stat-val">${total}</div><div class="stat-sub">completions</div></div>
  `;
  buildHeatmap(h,document.getElementById('heatmap-container'));
  buildTrendChart(h);buildWeeklyChart(h);buildRateChart(h);
}

function renderAnalytics(){
  if(!habits.length){
    document.getElementById('a-stats').innerHTML='';
    document.getElementById('comp-wrap').innerHTML='<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px;font-weight:500">Add habits to see analytics</div>';
    document.getElementById('leaderboard').innerHTML='';return;
  }
  const tot=habits.length,done=habits.filter(h=>h.completions[todayKey()]).length;
  const avg=Math.round(habits.reduce((a,h)=>a+rate30(h),0)/tot);
  document.getElementById('a-stats').innerHTML=`
    <div class="stat-card c1"><div class="stat-label">Avg rate</div><div class="stat-val">${avg}%</div><div class="stat-sub">last 30 days</div></div>
    <div class="stat-card c2"><div class="stat-label">Today done</div><div class="stat-val">${done}/${tot}</div><div class="stat-sub">habits</div></div>
  `;
  
  const compType=document.getElementById('comp-select').value;
  const aLabels=habits.map(h=>h.emoji+' '+h.name.slice(0,12));
  const aData=habits.map(h=>rate30(h));
  const aBg=habits.map(h=>h.color+'dd');
  const isHoriz=compType==='horizontalBar',isRadar=compType==='radar',isPolar=compType==='polarArea';
  
  destroyChart('comp');
  const compCfg={type:isHoriz?'bar':compType,data:{labels:aLabels,datasets:[{label:'30-day %',data:aData,backgroundColor:aBg,borderColor:habits.map(h=>h.color),borderWidth:isRadar||isPolar?2:0,borderRadius:(!isRadar&&!isPolar)?6:0}]},options:{indexAxis:isHoriz?'y':'x',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:(isRadar)?{r:{beginAtZero:true,max:100,ticks:{stepSize:25,font:{size:9,family:'Inter'}}}}:(isPolar)?{}:{x:{grid:{display:!isHoriz},ticks:{font:{size:10,family:'Inter'}}},y:{max:isHoriz?undefined:100,ticks:{callback:v=>isHoriz?v:v+'%',font:{size:10,family:'Inter'}},grid:{color:'rgba(128,128,128,.1)'}}}}};
  charts.comp=new Chart(document.getElementById('compChart'),compCfg);
  
  const distType=document.getElementById('dist-select').value;
  destroyChart('dist');
  charts.dist=new Chart(document.getElementById('distChart'),{type:distType,data:{labels:aLabels,datasets:[{data:aData,backgroundColor:aBg,borderWidth:2,borderColor:'var(--surface)',hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11,family:'Inter'},padding:12,usePointStyle:true}}}}});
  
  const sorted=[...habits].sort((a,b)=>calcStreak(b)-calcStreak(a));
  document.getElementById('leaderboard').innerHTML=sorted.map((h,i)=>`
    <div class="lb-item" style="animation-delay:${i*.08}s">
      <span class="lb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
      <div class="lb-emoji" style="background:${h.color}22;box-shadow:0 2px 8px ${h.color}33">${h.emoji}</div>
      <span class="lb-name">${h.name}</span>
      <span class="lb-val" style="color:${h.color}">🔥 ${calcStreak(h)}</span>
      <span style="font-size:11px;color:var(--muted);margin-left:12px;font-weight:600;width:30px;text-align:right">${rate30(h)}%</span>
    </div>
  `).join('');
}

function confirmClear(){
  if(confirm('Clear ALL data? This action cannot be undone.')){
    habits=[]; save(); renderToday(); renderSidebar(); navigate('today'); showToast('🧹 All data cleared');
  }
}

async function init(){
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = 'Inter';
  await load();
  fetchQuote();
  setInterval(fetchQuote, 30000); // auto-rotate quote every 30s
  
  if(!habits.length){
    habits=[
      {id:'1',name:'Meditate',emoji:'🧘',color:'#6C63FF',completions:{}},
      {id:'2',name:'Exercise',emoji:'🏃',color:'#43C59E',completions:{}},
      {id:'3',name:'Read 20 min',emoji:'📚',color:'#F59E0B',completions:{}},
      {id:'4',name:'Drink water',emoji:'💧',color:'#3B82F6',completions:{}},
    ];
    habits.forEach(h=>{for(let i=1;i<20;i++){const d=new Date();d.setDate(d.getDate()-i);if(Math.random()>.3)h.completions[dk(d)]=true}});
    await save();
  }
  renderSidebar();renderToday();
}
init();

