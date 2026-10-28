const K='gastos-v1';
const MN=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const $=s=>document.querySelector(s);
const nf=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fm=c=>nf.format(c/100);
const fz=c=>c?fm(c):'';
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pc=s=>{s=String(s||'').replace(/[^\d,.-]/g,'');if(s.includes(',')||/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'').replace(',','.');const v=Math.round(parseFloat(s)*100);return isNaN(v)?0:v};
const fi=c=>c?nf.format(c/100).replace(/\./g,''):'';

const def=()=>({names:['Pessoa 1','Pessoa 2'],sal:[0,0],items:[]});
let S;
try{S=JSON.parse(localStorage.getItem(K))||def()}catch{S=def()}
const save=()=>localStorage.setItem(K,JSON.stringify(S));
navigator.storage?.persist?.();

const d0=new Date();
let cur=d0.getFullYear()*12+d0.getMonth();
let ed=null;

const vis=(it,m)=>{const d=m-it.s;if(d<0)return 0;if(it.n>0)return d<it.n?d+1:0;return it.e==null||m<=it.e?-1:0};

function render(){
  $('#mes').textContent=MN[cur%12]+' '+Math.floor(cur/12);
  document.querySelectorAll('.n1').forEach(e=>e.textContent=S.names[0]);
  document.querySelectorAll('.n2').forEach(e=>e.textContent=S.names[1]);
  const rows=S.items.map(it=>[it,vis(it,cur)]).filter(r=>r[1]).sort((x,y)=>(x[0].n>0)-(y[0].n>0));
  $('#tab tbody').innerHTML=rows.map(([it,k])=>`<tr data-id="${it.id}"><td>${esc(it.d)}</td><td>${fz(it.a)}</td><td>${fz(it.b)}</td><td>${fm(it.a+it.b)}</td><td>${it.n?k+'/'+it.n:'Fixa'}</td></tr>`).join('')
    ||'<tr><td colspan="5" class="vazio">Sem despesas</td></tr>';
  const fx=[0,0],pa=[0,0];
  rows.forEach(([it])=>{const t=it.n?pa:fx;t[0]+=it.a;t[1]+=it.b});
  const tot=[fx[0]+pa[0],fx[1]+pa[1]];
  const sob=[S.sal[0]-tot[0],S.sal[1]-tot[1]];
  const r=(l,v,c='')=>`<tr class="${c}"><td>${l}</td>${[v[0],v[1],v[0]+v[1]].map(x=>`<td class="${x<0?'neg':''}">${fm(x)}</td>`).join('')}</tr>`;
  $('#sum tbody').innerHTML=r('Fixas',fx)+r('Parceladas',pa)+r('Total',tot,'tot')
    +`<tr><td>Salário</td>${[0,1].map(i=>`<td><input class="sal" data-i="${i}" inputmode="decimal" value="${fi(S.sal[i])}" placeholder="0,00"></td>`).join('')}<td>${fm(S.sal[0]+S.sal[1])}</td></tr>`
    +r('Sobra',sob,'sob');
  graf(fx,pa,tot);
}

function graf(fx,pa,tot){
  const lb=[S.names[0],S.names[1],'Total'];
  const F=[fx[0],fx[1],fx[0]+fx[1]],P=[pa[0],pa[1],pa[0]+pa[1]],T=[tot[0],tot[1],tot[0]+tot[1]],L=[S.sal[0],S.sal[1],S.sal[0]+S.sal[1]];
  const W=300,X=0,BW=W,H=22,G=40;
  let s='';
  for(let i=0;i<3;i++){
    const mx=Math.max(L[i],T[i],1),k=BW/mx,y=i*G+16;
    const w1=F[i]*k,w2=P[i]*k,w3=Math.max(L[i]-T[i],0)*k;
    s+=`<text x="${X}" y="${y-4}">${esc(lb[i])}</text><text class="m" x="${W}" y="${y-4}" text-anchor="end">${L[i]?Math.round(T[i]/L[i]*100)+'% do salário':''}</text>`;
    s+=`<rect class="gb" x="${X}" y="${y}" width="${BW}" height="${H}" rx="4"/>`;
    s+=`<rect class="g1" x="${X}" y="${y}" width="${w1}" height="${H}"/><rect class="g2" x="${X+w1}" y="${y}" width="${w2}" height="${H}"/><rect class="g3" x="${X+w1+w2}" y="${y}" width="${w3}" height="${H}"/>`;
    if(L[i]&&T[i]>L[i])s+=`<line class="gl" x1="${X+L[i]*k}" x2="${X+L[i]*k}" y1="${y-3}" y2="${y+H+3}"/>`;
  }
  const ly=3*G+12;
  s+=[['g1','Fixas'],['g2','Parceladas'],['g3','Sobra']].map(([c,t],j)=>`<rect class="${c}" x="${j*100}" y="${ly}" width="10" height="10" rx="2"/><text class="m" x="${j*100+14}" y="${ly+9}">${t}</text>`).join('');
  $('#graf').innerHTML=`<svg viewBox="0 0 ${W} ${ly+14}">${s}</svg>`;
}

const f=$('#f'),dlg=$('#dlg');
function open(it){
  ed=it||null;
  f.reset();
  f.d.value=it?.d||'';
  f.a.value=fi(it?.a);
  f.b.value=fi(it?.b);
  f.n.value=it?.n||0;
  f.k.value=it?.n?vis(it,cur):1;
  $('#del').hidden=!it;
  tk();
  dlg.showModal();
}
const tk=()=>$('#lk').style.visibility=+f.n.value>0?'visible':'hidden';
f.n.oninput=tk;

f.addEventListener('submit',e=>{
  if(e.submitter?.value!=='ok')return;
  const n=Math.max(0,parseInt(f.n.value)||0);
  const k=n?Math.min(Math.max(1,parseInt(f.k.value)||1),n):1;
  const it=ed||{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),e:null,s:cur};
  const wasP=ed&&ed.n>0;
  it.d=f.d.value.trim();it.a=pc(f.a.value);it.b=pc(f.b.value);
  if(n)it.s=cur-(k-1);else if(wasP)it.s=cur;
  it.n=n;
  if(!ed)S.items.push(it);
  save();render();
});

$('#del').onclick=()=>{
  if(!ed)return;
  if(!ed.n&&cur>ed.s){
    if(!confirm('Remover deste mês em diante?'))return;
    ed.e=cur-1;
  }else{
    if(!confirm('Excluir despesa?'))return;
    S.items=S.items.filter(x=>x!==ed);
  }
  save();dlg.close();render();
};

$('#add').onclick=()=>open();
$('#tab tbody').onclick=e=>{const tr=e.target.closest('tr[data-id]');if(tr)open(S.items.find(x=>x.id===tr.dataset.id))};
$('#prev').onclick=()=>{cur--;render()};
$('#next').onclick=()=>{cur++;render()};
$('#sum').addEventListener('change',e=>{if(e.target.classList.contains('sal')){S.sal[+e.target.dataset.i]=pc(e.target.value);save();render()}});

const fc=$('#fc'),dc=$('#dcfg');
$('#cfg').onclick=()=>{fc.n1.value=S.names[0];fc.n2.value=S.names[1];dc.showModal()};
fc.addEventListener('submit',()=>{S.names=[fc.n1.value.trim()||'Pessoa 1',fc.n2.value.trim()||'Pessoa 2'];save();render()});

$('#exp').onclick=async()=>{
  const name='gastos-'+new Date().toISOString().slice(0,10)+'.json';
  const file=new File([JSON.stringify(S)],name,{type:'application/json'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file]})}catch{}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;a.click();URL.revokeObjectURL(a.href);
};
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{
  const fl=e.target.files[0];e.target.value='';
  if(!fl)return;
  try{
    const d=JSON.parse(await fl.text());
    if(!Array.isArray(d.items)||!Array.isArray(d.names)||!Array.isArray(d.sal))throw 0;
    if(!confirm('Substituir dados atuais?'))return;
    S=d;save();dc.close();render();
  }catch{alert('Arquivo inválido')}
};

render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
