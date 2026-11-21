const $ = (id) => document.getElementById(id);
const CATEGORIES = {
  expense: ["Food & Dining","Transport","Shopping","Bills & Utilities","Entertainment","Health","Education","Travel","Other"],
  income: ["Salary","Freelance","Business","Investment","Gift","Other"]
};
const COLORS = ["#8b5cf6","#3b82f6","#fb7185","#f59e0b","#22c55e","#d946ef","#06b6d4","#f97316","#94a3b8"];
const ICONS = {"Food & Dining":"🍜","Transport":"🚕","Shopping":"🛍️","Bills & Utilities":"💡","Entertainment":"🎬","Health":"💊","Education":"📚","Travel":"✈️","Other":"◈","Salary":"💼","Freelance":"💻","Business":"🏢","Investment":"📈","Gift":"🎁"};
const STORAGE_KEY = "spendvizo.v1";
let state = loadState();
let activeView = "dashboard";
let toastTimer;
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return {transactions:Array.isArray(x?.transactions)?x.transactions:[],budget:Number(x?.budget)||0,theme:x?.theme==="light"?"light":"dark"};}catch{return {transactions:[],budget:0,theme:"dark"};}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);}
function dateLocal(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function monthKey(date){return String(date||"").slice(0,7);}
function currentMonthTx(){const m=dateLocal().slice(0,7);return state.transactions.filter(t=>monthKey(t.date)===m);}
function sum(list,type){return list.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount),0);}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setView(view){activeView=view;document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(view+"View").classList.add("active");document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("pageTitle").textContent=({dashboard:"Dashboard",transactions:"Transactions",budget:"Budget",reports:"Reports"})[view];$("sidebar").classList.remove("open");render();}
function fillCategories(type,selected){$("categoryInput").innerHTML=CATEGORIES[type].map(c=>`<option ${c===selected?"selected":""}>${escapeHTML(c)}</option>`).join("");}
function openModal(tx){$("transactionModal").classList.remove("hidden");$("transactionForm").reset();$("formError").textContent="";$("transactionId").value=tx?.id||"";$("modalTitle").textContent=tx?"Edit transaction":"Add transaction";$("transactionType").value=tx?.type||"expense";document.querySelectorAll(".type-option").forEach(b=>b.classList.toggle("active",b.dataset.type===$("transactionType").value));fillCategories($("transactionType").value,tx?.category);$("amountInput").value=tx?.amount??"";$("descriptionInput").value=tx?.description??"";$("dateInput").value=tx?.date||dateLocal();}
function closeModal(){$("transactionModal").classList.add("hidden");}
function render(){
 const tx=currentMonthTx(),inc=sum(tx,"income"),exp=sum(tx,"expense"),net=inc-exp,left=state.budget-exp;
 $("currentMonth").textContent=new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});
 $("incomeTotal").textContent=money(inc);$("expenseTotal").textContent=money(exp);$("balanceTotal").textContent=money(net);$("budgetRemaining").textContent=money(left);
 $("budgetFoot").textContent=state.budget?`${Math.max(0,Math.round(exp/state.budget*100))}% of monthly budget used`:"Set a monthly budget";
 $("donutTotal").textContent=money(exp);renderDonut(tx);renderCashflow();renderRows("recentRows",state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5),false);
 $("recentEmpty").classList.toggle("hidden",state.transactions.length>0);
 renderAllTransactions();renderBudget();renderReports();
}
function renderDonut(tx){
 const totals={};tx.filter(t=>t.type==="expense").forEach(t=>totals[t.category]=(totals[t.category]||0)+Number(t.amount));
 const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]),total=entries.reduce((a,e)=>a+e[1],0);
 let angle=0;const segments=entries.map(([cat,val],i)=>{const start=angle;angle+=total?val/total*360:0;return `${COLORS[i%COLORS.length]} ${start}deg ${angle}deg`;});
 $("donut").style.background=total?`conic-gradient(${segments.join(",")})`:"conic-gradient(#263451 0deg 360deg)";
 $("categoryLegend").innerHTML=entries.length?entries.slice(0,7).map(([cat,val],i)=>`<div class="legend-row"><span class="legend-name"><i class="legend-swatch" style="background:${COLORS[i%COLORS.length]}"></i><span>${escapeHTML(cat)}</span></span><b>${Math.round(val/total*100)}%</b></div>`).join(""):'<div class="empty-state">Add expenses to see your breakdown.</div>';
}
function renderCashflow(){
 const months=[];const now=new Date();for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-IN",{month:"short"})});}
 const vals=months.map(m=>{const list=state.transactions.filter(t=>monthKey(t.date)===m.key);return {label:m.label,inc:sum(list,"income"),exp:sum(list,"expense")};});const max=Math.max(1,...vals.flatMap(v=>[v.inc,v.exp]));
 $("cashflowChart").innerHTML=vals.map(v=>`<div class="bar-group"><div class="bar income" title="Income ${money(v.inc)}" style="height:${Math.max(v.inc?3:0,v.inc/max*100)}%"></div><div class="bar expense" title="Expenses ${money(v.exp)}" style="height:${Math.max(v.exp?3:0,v.exp/max*100)}%"></div><span class="bar-label">${v.label}</span></div>`).join("");
}
function renderRows(target,list,showType){
 $(target).innerHTML=list.map(t=>`<tr><td><div class="detail-cell"><span class="category-icon">${ICONS[t.category]||"◈"}</span><span>${escapeHTML(t.description)}</span></div></td><td><span class="category-pill">${escapeHTML(t.category)}</span></td><td>${new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>${showType?`<td>${t.type==="income"?"Income":"Expense"}</td>`:""}<td class="align-right ${t.type==="income"?"amount-income":"amount-expense"}">${t.type==="income"?"+":"−"} ${money(t.amount)}</td><td><div class="row-actions"><button class="small-action" data-edit="${t.id}" title="Edit">✎</button><button class="small-action delete" data-delete="${t.id}" title="Delete">×</button></div></td></tr>`).join("");
}
function renderAllTransactions(){
 const search=($("transactionSearch").value||$("globalSearch").value).trim().toLowerCase();
 const amountText=$("amountFilter").value.trim(),amount=amountText===""?null:Number(amountText);
 const category=$("categoryFilter").value,type=$("typeFilter").value,month=$("monthFilter").value;
 const list=state.transactions.filter(t=>
   (!search||`${t.description} ${t.category} ${t.amount}`.toLowerCase().includes(search)) &&
   (amount===null||(Number.isFinite(amount)&&Number(t.amount)===amount)) &&
   (category==="all"||t.category===category) &&
   (type==="all"||t.type===type) &&
   (month==="all"||monthKey(t.date)===month)
 ).sort((a,b)=>b.date.localeCompare(a.date));
 renderRows("allRows",list,true);$("allEmpty").classList.toggle("hidden",list.length>0);
 const months=[...new Set(state.transactions.map(t=>monthKey(t.date)))].sort().reverse();const current=$("monthFilter").value;
 $("monthFilter").innerHTML='<option value="all">All months</option>'+months.map(m=>`<option value="${m}">${new Date(m+"-01T00:00:00").toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</option>`).join("");$("monthFilter").value=months.includes(current)?current:"all";
 const categories=[...new Set(state.transactions.map(t=>t.category))].sort();
 const currentCategory=$("categoryFilter").value;
 $("categoryFilter").innerHTML='<option value="all">All categories</option>'+categories.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
 $("categoryFilter").value=categories.includes(currentCategory)?currentCategory:"all";
}
function renderBudget(){
 const tx=currentMonthTx(),spent=sum(tx,"expense"),left=state.budget-spent,pct=state.budget?spent/state.budget*100:0;
 $("budgetDisplay").textContent=money(state.budget);$("budgetSummary").textContent=state.budget?`${money(spent)} spent out of ${money(state.budget)} this month.`:"Set a monthly budget to monitor your spending.";
 $("budgetInput").value=state.budget||"";$("budgetProgress").style.width=Math.min(100,pct)+"%";$("budgetSpent").textContent=money(spent)+" spent";$("budgetPercent").textContent=Math.round(pct)+"%";$("budgetLeft").textContent=money(left)+" left";
 $("budgetMessage").textContent=!state.budget?"Add a budget to see your progress.":pct>100?`You are ${money(Math.abs(left))} over budget. Review your recent expenses.`:pct>=80?"You have used more than 80% of your budget. Keep an eye on spending.":`You are within budget, with ${money(left)} remaining.`;
}
function renderReports(){
 const inc=sum(state.transactions,"income"),exp=sum(state.transactions,"expense");$("allIncome").textContent=money(inc);$("allExpenses").textContent=money(exp);$("allNet").textContent=money(inc-exp);$("allCount").textContent=state.transactions.length;
 const totals={};state.transactions.filter(t=>t.type==="expense").forEach(t=>totals[t.category]=(totals[t.category]||0)+Number(t.amount));const arr=Object.entries(totals).sort((a,b)=>b[1]-a[1]),max=arr[0]?.[1]||1;
 $("reportCategories").innerHTML=arr.length?arr.map(([c,v])=>`<div class="report-row"><span>${ICONS[c]||"◈"} ${escapeHTML(c)}</span><div class="report-track"><span style="width:${v/max*100}%"></span></div><b class="align-right">${money(v)}</b></div>`).join(""):'<div class="empty-state">Your category report will appear here.</div>';
}
function saveTransaction(e){
 e.preventDefault();const id=$("transactionId").value||crypto.randomUUID();const type=$("transactionType").value,amount=Number($("amountInput").value),category=$("categoryInput").value,description=$("descriptionInput").value.trim(),date=$("dateInput").value;
 if(!Number.isFinite(amount)||amount<=0||!description||!date){$("formError").textContent="Enter a valid amount, description, and date.";return;}
 const old=state.transactions.find(t=>t.id===id);const item={id,type,amount,category,description,date,createdAt:old?.createdAt||new Date().toISOString()};
 state.transactions=old?state.transactions.map(t=>t.id===id?item:t):[item,...state.transactions];save();closeModal();render();toast(old?"Transaction updated.":"Transaction added.");
}
function deleteTransaction(id){const t=state.transactions.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete "${t.description}"? This cannot be undone unless you have a backup.`))return;state.transactions=state.transactions.filter(x=>x.id!==id);save();render();toast("Transaction deleted.");}
function openExportModal(){$("exportModal").classList.remove("hidden");}
function closeExportModal(){$("exportModal").classList.add("hidden");}
function reportRows(){return state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(t=>({Date:t.date,Type:t.type==="income"?"Income":"Expense",Category:t.category,Description:t.description,Amount:Number(t.amount)}));}
function exportExcel(){
 if(!window.XLSX){alert("Excel export library could not load. Check your internet connection and try again.");return;}
 const rows=reportRows(),income=sum(state.transactions,"income"),expenses=sum(state.transactions,"expense");
 const summary=[["Spendvizo – Expense Report"],["Generated",new Date().toLocaleString("en-IN")],["Total Income (INR)",income],["Total Expenses (INR)",expenses],["Net Balance (INR)",income-expenses],[],["Date","Type","Category","Description","Amount (INR)"],...rows.map(r=>[r.Date,r.Type,r.Category,r.Description,r.Amount])];
 const sheet=XLSX.utils.aoa_to_sheet(summary);sheet["!cols"]=[{wch:16},{wch:14},{wch:22},{wch:32},{wch:18}];
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,"Expense Report");XLSX.writeFile(book,"spendvizo-expense-report.xlsx");closeExportModal();toast("Excel report downloaded.");
}
function exportPDF(){
 if(!window.jspdf?.jsPDF){alert("PDF export library could not load. Check your internet connection and try again.");return;}
 const {jsPDF}=window.jspdf,doc=new jsPDF(),rows=reportRows(),income=sum(state.transactions,"income"),expenses=sum(state.transactions,"expense");
 doc.setFontSize(20);doc.text("Spendvizo - Expense Report",14,18);doc.setFontSize(10);doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`,14,26);
 doc.setFontSize(11);doc.text(`Total Income: INR ${income.toLocaleString("en-IN")}`,14,38);doc.text(`Total Expenses: INR ${expenses.toLocaleString("en-IN")}`,14,45);doc.text(`Net Balance: INR ${(income-expenses).toLocaleString("en-IN")}`,14,52);
 doc.autoTable({startY:60,head:[["Date","Type","Category","Description","Amount (INR)"]],body:rows.map(r=>[r.Date,r.Type,r.Category,r.Description,Number(r.Amount).toLocaleString("en-IN")]),styles:{fontSize:8,cellPadding:2.5},headStyles:{fillColor:[105,65,198]},columnStyles:{0:{cellWidth:25},1:{cellWidth:22},2:{cellWidth:32},4:{halign:"right",cellWidth:27}}});
 doc.save("spendvizo-expense-report.pdf");closeExportModal();toast("PDF report downloaded.");
}
function backup(){download(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),"spendvizo-backup.json");toast("Backup downloaded.");}
function download(blob,name){const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.goto)));
$("topAddBtn").addEventListener("click",()=>openModal());$("transactionsAddBtn").addEventListener("click",()=>openModal());
$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);$("transactionForm").addEventListener("submit",saveTransaction);
document.querySelectorAll(".type-option").forEach(b=>b.addEventListener("click",()=>{$("transactionType").value=b.dataset.type;document.querySelectorAll(".type-option").forEach(x=>x.classList.toggle("active",x===b));fillCategories(b.dataset.type);}));
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const tx=state.transactions.find(t=>t.id===edit.dataset.edit);if(tx)openModal(tx);}if(del)deleteTransaction(del.dataset.delete);});
$("budgetForm").addEventListener("submit",e=>{e.preventDefault();const n=Number($("budgetInput").value);if(!Number.isFinite(n)||n<0)return;state.budget=n;save();render();toast("Monthly budget saved.");});
$("exportBtn").addEventListener("click",openExportModal);$("closeExportModal").addEventListener("click",closeExportModal);$("cancelExport").addEventListener("click",closeExportModal);$("downloadExcel").addEventListener("click",exportExcel);$("downloadPDF").addEventListener("click",exportPDF);$("exportModal").addEventListener("click",e=>{if(e.target===$("exportModal"))closeExportModal();});$("backupBtn").addEventListener("click",backup);$("restoreBtn").addEventListener("click",()=>$("restoreInput").click());
$("restoreInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.transactions)||typeof data.budget!=="number")throw Error();if(!confirm("Replace current Spendvizo data with this backup?"))return;state={transactions:data.transactions,budget:data.budget,theme:data.theme==="light"?"light":"dark"};save();applyTheme();render();toast("Backup restored.");}catch{alert("This backup file is not valid Spendvizo data.");}e.target.value="";});
$("transactionSearch").addEventListener("input",renderAllTransactions);$("amountFilter").addEventListener("input",renderAllTransactions);$("categoryFilter").addEventListener("change",renderAllTransactions);$("typeFilter").addEventListener("change",renderAllTransactions);$("monthFilter").addEventListener("change",renderAllTransactions);
$("clearFiltersBtn").addEventListener("click",()=>{$("transactionSearch").value="";$("amountFilter").value="";$("categoryFilter").value="all";$("typeFilter").value="all";$("monthFilter").value="all";$("globalSearch").value="";renderAllTransactions();});
$("globalSearch").addEventListener("input",()=>{if(activeView!=="transactions")setView("transactions");$("transactionSearch").value=$("globalSearch").value;renderAllTransactions();});
$("themeBtn").addEventListener("click",()=>{state.theme=state.theme==="dark"?"light":"dark";save();applyTheme();});
function applyTheme(){document.body.classList.toggle("light",state.theme==="light");$("themeBtn").textContent=state.theme==="light"?"☾":"☼";}
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("transactionModal").addEventListener("click",e=>{if(e.target===$("transactionModal"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeExportModal();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("globalSearch").focus();}});
$("year").textContent=new Date().getFullYear();fillCategories("expense");applyTheme();render();
