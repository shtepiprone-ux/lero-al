import{j as e,r as g}from"./iframe-BWqC60Cj.js";import{A as T,a as fe,b as we,c as _e}from"./AdminTable-D-siluVH.js";import{s as ke}from"./_storyI18n-DUPbxmag.js";import{B as y}from"./badge-DkqjA9o-.js";import{I as Ce}from"./input-ByZEYirH.js";import{P as Se,a as Ne,b as je}from"./popover-CTqmbuqI.js";import{D as Ae,a as Re,b as Te,c as ue,d as Le}from"./dropdown-menu-D-E20Nhh.js";import{c as pe}from"./utils-D5ceN5oG.js";import{C as ce}from"./check-BHCgvXo2.js";import"./preload-helper-Dp1pzeXC.js";import"./AdminCardList-D2aUWl1F.js";import"./chevron-right-daoqVDRa.js";import"./createLucideIcon-DZTr3VOw.js";import"./index-PXfbuUw3.js";import"./eye-off-B8Q0VpJu.js";import"./index-D4MQtXW4.js";import"./useRenderElement-DCWLj8DQ.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./shadowDom-KUr5fxLu.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./index-DTzEXCUc.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";import"./useButton-62N7Qls-.js";import"./useTriggerFocusGuards-BRKpHu-Z.js";import"./safePolygon-B3UYXLcm.js";import"./usePositioner-6ZAe_XXl.js";import"./DirectionContext-CtLbILH8.js";import"./useAnchoredPopupScrollLock-B9Vs29W1.js";import"./getPseudoElementBounds-DoZBSa7U.js";import"./CompositeItem-HNATLU3Z.js";import"./useCompositeItem-D48be0U8.js";import"./CompositeList-S6-dMJcD.js";var D,M,K,U,E,Z,I,O,H,F,P,B,$,q,z,W,V,G,Y,J,Q,X,ee,te,oe,ae,re,se,le,ne;const De={colName:"col_name",colStatus:"col_status",colRole:"col_role",colEmail:"col_email",colPhone:"col_phone",colLocation:"col_location",colCreated:"col_created",sortAZ:"sort_az",sortZA:"sort_za",newestFirst:"newest_first",oldestFirst:"oldest_first",lowHigh:"low_high",highLow:"high_low",hideColumn:"hide_col",columns:"columns",searchPlaceholder:"search_ph",noResults:"no_results",noData:"no_data",active:"active",inactive:"inactive",agent:"agent",user:"user",moderator:"moderator",selectedRecord:"selected_record",clickARow:"click_row",mobileSort:"mobile_sort",sortBy:"sort_by",showColumn:"show_col",hiddenSuffix:"hidden_suffix",lockedSuffix:"locked_suffix"};function x(l){const o={};for(const[a,t]of Object.entries(De))o[a]=ke(l,`storybook.admin_table.${t}`);return o}const Me=[{id:"1",name:"Arben Krasniqi",state:"on",role:"Agent",created:"2026-01-15",email:"arben@example.com",phone:"+355 69 123 4567",location:"Tirana"},{id:"2",name:"Oksana Petrenko",state:"off",role:"User",created:"2026-02-20",email:"oksana@example.com",phone:"+380 50 987 6543",location:"Kyiv"},{id:"3",name:"Marco Rossi",state:"on",role:"Moderator",created:"2026-03-01",email:"marco@example.com",phone:"+39 02 1234 5678",location:"Milan"}],Ke=[{id:"1",name:"Оголошення про продаж квартири в центрі міста — довга назва для перевірки обрізання тексту",status:"В обробці",statusCode:"in_progress"},{id:"2",name:"Оренда офісного приміщення поруч з метро — ще одна довга назва",status:"Активне",statusCode:"active"},{id:"3",name:"Продаж будинку з ділянкою в передмісті",status:"Очікує",statusCode:"pending"}];function he(l){return l==="active"?"success":l==="in_progress"?"info":"warning"}const ie=[{key:"name",labelKey:"colName",sortType:"text",hideable:!1},{key:"state",labelKey:"colStatus",sortType:"text",hideable:!0},{key:"role",labelKey:"colRole",sortType:"text",hideable:!0,visibility:"sm"},{key:"email",labelKey:"colEmail",hideable:!0,visibility:"md"},{key:"phone",labelKey:"colPhone",hideable:!0,visibility:"lg"},{key:"location",labelKey:"colLocation",sortType:"text",hideable:!0,visibility:"lg"},{key:"created",labelKey:"colCreated",sortType:"date",hideable:!0,visibility:"xl"}];function Ue(l){const o=x(l);return a=>{var t;return{title:e.jsx("span",{className:"font-medium",children:a.name}),subtitle:e.jsxs("div",{className:"flex items-center gap-2 flex-wrap mt-1",children:[e.jsx(y,{variant:a.state==="on"?"success":"neutral",className:"text-xs",children:a.state==="on"?o.active:o.inactive}),e.jsx("span",{className:"text-xs text-muted-foreground",children:(t=o[a.role.toLowerCase()])!==null&&t!==void 0?t:a.role})]}),meta:e.jsxs("div",{className:"flex flex-col gap-0.5 mt-1",children:[e.jsx("span",{className:"text-xs text-muted-foreground",children:a.email}),e.jsx("span",{className:"text-xs text-muted-foreground",children:a.location})]})}}}function Ee({colDefs:l,hidden:o,onToggle:a,locale:t}){const s=x(t);return e.jsxs(Se,{children:[e.jsx(Ne,{className:"flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-muted transition-colors cursor-pointer max-sm:w-full max-sm:justify-center",children:s.columns}),e.jsx(je,{align:"end",className:"w-48 p-2 space-y-0.5",children:l.map(n=>{const p=o.has(n.key),i=!n.hideable,c=s[n.labelKey];return e.jsxs("div",{role:"checkbox","aria-checked":!p,tabIndex:i?-1:0,className:pe("flex items-center gap-2.5 px-2 py-1.5 rounded text-sm select-none",i?"opacity-50 cursor-not-allowed":"hover:bg-muted cursor-pointer"),onClick:()=>!i&&a(n.key),onKeyDown:m=>{!i&&(m.key==="Enter"||m.key===" ")&&(m.preventDefault(),a(n.key))},children:[e.jsx("span",{className:pe("h-4 w-4 rounded border flex items-center justify-center shrink-0",p?"border-border":"bg-primary border-primary text-primary-foreground"),"aria-hidden":"true",children:!p&&e.jsx(ce,{className:"h-2.5 w-2.5"})}),e.jsx("span",{className:"flex-1 truncate",children:c}),i&&e.jsx("span",{className:"text-xs text-muted-foreground shrink-0",children:s.lockedSuffix})]},n.key)})})]})}function Ze({colDefs:l,sort:o,onSort:a,locale:t}){const s=x(t),n=l.filter(c=>c.sortType),p=n.find(c=>c.key===o.key),i=p?`${s[p.labelKey]} ${o.dir==="asc"?"↑":"↓"}`:s.mobileSort;return e.jsxs(Ae,{children:[e.jsxs(Re,{className:"flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-muted transition-colors cursor-pointer max-sm:w-full max-sm:justify-center",children:[e.jsx(fe,{className:"h-3.5 w-3.5 shrink-0","aria-hidden":"true"}),i]}),e.jsx(Te,{align:"start",className:"min-w-48",children:n.map(c=>{const m=s[c.labelKey],L=c.sortType==="date"?s.newestFirst:s.sortAZ,d=c.sortType==="date"?s.oldestFirst:s.sortZA;return[e.jsxs(ue,{onClick:()=>a(c.key,"asc"),children:[e.jsx(we,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}),m,": ",L,o.key===c.key&&o.dir==="asc"&&e.jsx(ce,{className:"h-3.5 w-3.5 ml-auto shrink-0 text-primary"})]},`${c.key}-asc`),e.jsxs(ue,{onClick:()=>a(c.key,"desc"),children:[e.jsx(_e,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}),m,": ",d,o.key===c.key&&o.dir==="desc"&&e.jsx(ce,{className:"h-3.5 w-3.5 ml-auto shrink-0 text-primary"})]},`${c.key}-desc`),e.jsx(Le,{},`${c.key}-sep`)]})})]})}function b({locale:l="en",interactive:o=!1,initialHidden:a=[]}){const[t,s]=g.useState(""),[n,p]=g.useState({key:null,dir:null}),[i,c]=g.useState(new Set(a)),[m,L]=g.useState(null),d=x(l);function de(r,u){p({key:r,dir:u})}function ve(r){c(u=>new Set([...u,r]))}function be(r){c(u=>{const h=new Set(u);return h.has(r)?h.delete(r):h.add(r),h})}const me=Me.filter(r=>{if(!t)return!0;const u=t.toLowerCase();return r.name.toLowerCase().includes(u)||r.email.toLowerCase().includes(u)}),xe=n.key&&n.dir?[...me].sort((r,u)=>{const h=n.key;return n.dir==="asc"?String(r[h]).localeCompare(String(u[h])):String(u[h]).localeCompare(String(r[h]))}):me,ge=ie.filter(r=>!i.has(r.key)).map(r=>{const u=d[r.labelKey],h=r.sortType?{asc:r.sortType==="date"?d.newestFirst:d.sortAZ,desc:r.sortType==="date"?d.oldestFirst:d.sortZA,hide:d.hideColumn}:void 0;return{key:r.key,header:u,visibility:r.visibility,sortable:!!r.sortType,sortType:r.sortType,sortDirection:n.key===r.key?n.dir:null,onSort:r.sortType?v=>de(r.key,v):void 0,hideable:r.hideable,onHideColumn:r.hideable?()=>ve(r.key):void 0,sortLabels:h,cell:v=>r.key==="name"?e.jsx("span",{className:"font-medium",children:v.name}):r.key==="state"?e.jsx(y,{variant:v.state==="on"?"success":"neutral",children:v.state==="on"?d.active:d.inactive}):r.key==="role"?v.role:r.key==="email"?v.email:r.key==="phone"?v.phone:r.key==="location"?v.location:r.key==="created"?v.created:null}}),ye=t?d.noResults:d.noData;return e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap max-sm:flex-col [&>*]:max-sm:w-full",children:[e.jsx(Ce,{type:"search",className:"h-9 flex-1 min-w-[180px]",placeholder:d.searchPlaceholder,value:t,onChange:r=>s(r.target.value)}),e.jsx(Ee,{colDefs:ie,hidden:i,onToggle:be,locale:l})]}),e.jsx("div",{className:"lg:hidden max-sm:w-full",children:e.jsx(Ze,{colDefs:ie,sort:n,onSort:de,locale:l})}),e.jsx(T,{rows:xe,columns:ge,rowKey:r=>r.id,emptyState:ye,cardRow:Ue(l),onRowClick:o?L:void 0}),o&&!m&&e.jsx("p",{className:"text-xs text-muted-foreground italic px-1",children:d.clickARow}),o&&m&&e.jsxs("div",{className:"rounded-xl border bg-card p-4 space-y-1.5",children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground uppercase tracking-wide",children:d.selectedRecord}),e.jsx("p",{className:"text-sm font-medium",children:m.name}),e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx(y,{variant:m.state==="on"?"success":"neutral",className:"text-xs",children:m.state==="on"?d.active:d.inactive}),e.jsx("span",{className:"text-xs text-muted-foreground",children:m.role}),e.jsx("span",{className:"text-xs text-muted-foreground",children:m.email}),e.jsx("span",{className:"text-xs text-muted-foreground",children:m.location})]})]})]})}const Rt={title:"Admin/AdminTable",tags:["autodocs"],parameters:{docs:{description:{component:`Canonical admin table — sort + hide column menus + Columns manager + global search.

**Desktop (≥1024px — table mode):** sortable/hideable column headers show a small \`ArrowUpDown\` icon (\`h-3 w-3\`, 12px — strictly smaller than the \`text-sm\` 14px header). Clicking opens a DropdownMenu with type-correct sort items (A→Z/Z→A for text, Newest/Oldest for dates) and a "Hide column" item (EyeOff). A "Columns" button opens a Popover checklist for showing/hiding all columns. A single global search input is the ONLY data-narrowing control — no filter chips.

**Mobile (<1024px — card mode):** auto-switches to AdminCardList cards. A compact Sort dropdown provides the same sort model. The "Columns" manager is available above the cards.

**Forbidden icons:** Funnel, Sliders, SlidersHorizontal, Tune, Settings, Settings2, ListFilter, Filter. Allowed: ArrowUpDown (header trigger), ArrowUp, ArrowDown (menu), EyeOff (hide column), Check (active indicator), ChevronRight (interactive row).

**Story taxonomy:** use the **viewport toolbar** to check any story at all 14 canonical DS widths (320–2560). Use the **locale toolbar** to verify sq/en/uk/it. Stories are scenario-named — no per-width exports.`}}}},f={parameters:{docs:{description:{story:'Static canonical table at 1200px. Sortable headers show small ⇅ (h-3 w-3) icons. Click a ⇅ to open the sort/hide menu. "Columns" button opens the visibility manager. Global search narrows rows. No filter chips. No row interaction (no chevron).'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s})},globals:{viewport:{value:"canonical1200",isRotated:!1}}},w={parameters:{docs:{description:{story:'Column sort/hide menus. Click the ⇅ on "Name" → Sort A→Z / Sort Z→A + Hide column. Click the ⇅ on "Created" → Newest first / Oldest first (date labels). After sorting, the active column shows a Check indicator and the ⇅ icon turns primary. After hiding a column, restore it via the Columns manager.'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},_={parameters:{docs:{description:{story:'Columns manager — "Email" is pre-hidden. Click "Columns" to open the checklist. Re-check "Email" to restore the column. "Name" (first/sticky column) is locked — cannot be hidden to prevent all-columns-hidden state.'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s,initialHidden:["email"]})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},k={parameters:{docs:{description:{story:"390px — card mode (<1024px). Cards with compact Sort dropdown above. Sort model is the same as desktop; column hide/manage is table-mode only. No row chevron (static). Use viewport toolbar to check 320–960px range."}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s})},globals:{viewport:{value:"mobile390",isRotated:!1}}},C={parameters:{docs:{description:{story:'1280px interactive. Trailing ChevronRight column on every data row. Click a row → "Selected record" panel. Sort menus, global search, and Columns manager coexist with row interaction. Compare Default (static, no chevron) to see identical sort/search/columns UI.'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s,interactive:!0})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},S={parameters:{docs:{description:{story:'390px card mode — interactive. Auto-ChevronRight in card trailing (via AdminCardList). Click a card → "Selected record" panel. Sort dropdown + search + Columns manager all present.'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s,interactive:!0})},globals:{viewport:{value:"mobile390",isRotated:!1}}},N={parameters:{docs:{description:{story:"Auto card↔table switch. Start at 768px (card mode). Use the viewport toolbar: < 1024px → card mode + Sort dropdown; ≥ 1024px → table mode + ⇅ column menus. Same component, same props, same sort model throughout."}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return e.jsx(b,{locale:s})},globals:{viewport:{value:"tablet768",isRotated:!1}}},j={parameters:{docs:{description:{story:'uk@1280: long Ukrainian listing titles + interactive. Titles wrap with break-words; trailing chevron stays visible. Use the locale toolbar to check sq / it / en — all sort labels and "Columns" manager are localized. Use the viewport toolbar to check 320–2560px.'}}},render:()=>{const[l,o]=g.useState(null),a=[{key:"name",header:"Назва",sortable:!0,sortType:"text",sortLabels:{asc:"Сортувати A→Z",desc:"Сортувати Z→A",hide:"Приховати стовпець"},hideable:!1,cell:t=>e.jsx("span",{className:"font-medium break-words",title:t.name,children:t.name})},{key:"status",header:"Статус",sortable:!1,hideable:!0,sortLabels:{asc:"A→Z",desc:"Z→A",hide:"Приховати стовпець"},onHideColumn:()=>{},cell:t=>e.jsx(y,{variant:he(t.statusCode),children:t.status})}];return e.jsxs("div",{className:"space-y-4",children:[e.jsx(T,{rows:Ke,columns:a,rowKey:t=>t.id,emptyState:"Немає записів.",ariaLabel:"Таблиця оголошень",onRowClick:o}),l?e.jsxs("div",{className:"rounded-xl border bg-card p-4 space-y-1.5",children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground uppercase tracking-wide",children:"Вибраний запис"}),e.jsx("p",{className:"text-sm font-medium break-words",children:l.name}),e.jsx(y,{variant:he(l.statusCode),className:"text-xs",children:l.status})]}):e.jsx("p",{className:"text-xs text-muted-foreground italic px-1",children:"Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан."})]})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},A={parameters:{docs:{description:{story:'Empty state. No rows → no chevrons, no sort affordances active. Type in the search box to trigger the "No records match the search" empty state.'}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en",n=x(s),p=[{key:"name",header:n.colName,sortable:!0,sortType:"text",hideable:!1,cell:i=>i.name},{key:"state",header:n.colStatus,sortable:!0,sortType:"text",hideable:!0,cell:i=>i.state},{key:"role",header:n.colRole,sortable:!0,sortType:"text",hideable:!0,visibility:"sm",cell:i=>i.role},{key:"created",header:n.colCreated,sortable:!0,sortType:"date",hideable:!0,visibility:"xl",cell:i=>i.created}];return e.jsx(T,{rows:[],columns:p,rowKey:i=>i.id,emptyState:n.noData})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},R={parameters:{docs:{description:{story:"Loading skeleton — animate-pulse rows. No active affordances."}}},render:(l,o)=>{var a,t;const s=(t=o==null||(a=o.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en",n=x(s),p=[{key:"name",header:n.colName,sortable:!0,sortType:"text",hideable:!1,cell:i=>i.name},{key:"state",header:n.colStatus,sortable:!0,sortType:"text",hideable:!0,cell:i=>i.state},{key:"role",header:n.colRole,sortable:!0,sortType:"text",hideable:!0,visibility:"sm",cell:i=>i.role}];return e.jsx(T,{rows:[],columns:p,rowKey:i=>i.id,emptyState:n.noData,loading:!0})},globals:{viewport:{value:"desktop1280",isRotated:!1}}};f.parameters={...f.parameters,docs:{...(D=f.parameters)===null||D===void 0?void 0:D.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Static canonical table at 1200px. Sortable headers show small ⇅ (h-3 w-3) icons. ' + 'Click a ⇅ to open the sort/hide menu. "Columns" button opens the visibility manager. ' + 'Global search narrows rows. No filter chips. No row interaction (no chevron).'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'canonical1200',
      isRotated: false
    }
  }
}`,...(K=f.parameters)===null||K===void 0||(M=K.docs)===null||M===void 0?void 0:M.source}}};w.parameters={...w.parameters,docs:{...(U=w.parameters)===null||U===void 0?void 0:U.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Column sort/hide menus. Click the ⇅ on "Name" → Sort A→Z / Sort Z→A + Hide column. ' + 'Click the ⇅ on "Created" → Newest first / Oldest first (date labels). ' + 'After sorting, the active column shows a Check indicator and the ⇅ icon turns primary. ' + 'After hiding a column, restore it via the Columns manager.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(Z=w.parameters)===null||Z===void 0||(E=Z.docs)===null||E===void 0?void 0:E.source}}};_.parameters={..._.parameters,docs:{...(I=_.parameters)===null||I===void 0?void 0:I.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Columns manager — "Email" is pre-hidden. Click "Columns" to open the checklist. ' + 'Re-check "Email" to restore the column. ' + '"Name" (first/sticky column) is locked — cannot be hidden to prevent all-columns-hidden state.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} initialHidden={['email']} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(H=_.parameters)===null||H===void 0||(O=H.docs)===null||O===void 0?void 0:O.source}}};k.parameters={...k.parameters,docs:{...(F=k.parameters)===null||F===void 0?void 0:F.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '390px — card mode (<1024px). Cards with compact Sort dropdown above. ' + 'Sort model is the same as desktop; column hide/manage is table-mode only. ' + 'No row chevron (static). Use viewport toolbar to check 320–960px range.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'mobile390',
      isRotated: false
    }
  }
}`,...(B=k.parameters)===null||B===void 0||(P=B.docs)===null||P===void 0?void 0:P.source}}};C.parameters={...C.parameters,docs:{...($=C.parameters)===null||$===void 0?void 0:$.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '1280px interactive. Trailing ChevronRight column on every data row. ' + 'Click a row → "Selected record" panel. ' + 'Sort menus, global search, and Columns manager coexist with row interaction. ' + 'Compare Default (static, no chevron) to see identical sort/search/columns UI.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} interactive />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(z=C.parameters)===null||z===void 0||(q=z.docs)===null||q===void 0?void 0:q.source}}};S.parameters={...S.parameters,docs:{...(W=S.parameters)===null||W===void 0?void 0:W.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '390px card mode — interactive. Auto-ChevronRight in card trailing (via AdminCardList). ' + 'Click a card → "Selected record" panel. Sort dropdown + search + Columns manager all present.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} interactive />;
  },
  globals: {
    viewport: {
      value: 'mobile390',
      isRotated: false
    }
  }
}`,...(G=S.parameters)===null||G===void 0||(V=G.docs)===null||V===void 0?void 0:V.source}}};N.parameters={...N.parameters,docs:{...(Y=N.parameters)===null||Y===void 0?void 0:Y.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Auto card↔table switch. Start at 768px (card mode). Use the viewport toolbar: ' + '< 1024px → card mode + Sort dropdown; ≥ 1024px → table mode + ⇅ column menus. ' + 'Same component, same props, same sort model throughout.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminTableDemo locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'tablet768',
      isRotated: false
    }
  }
}`,...(Q=N.parameters)===null||Q===void 0||(J=Q.docs)===null||J===void 0?void 0:J.source}}};j.parameters={...j.parameters,docs:{...(X=j.parameters)===null||X===void 0?void 0:X.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@1280: long Ukrainian listing titles + interactive. ' + 'Titles wrap with break-words; trailing chevron stays visible. ' + 'Use the locale toolbar to check sq / it / en — all sort labels and "Columns" manager are localized. ' + 'Use the viewport toolbar to check 320–2560px.'
      }
    }
  },
  render: () => {
    // Long-string interactive table (uses UK_ROWS dataset for extreme title length test)
    const [selected, setSelected] = useState<UkRow | null>(null);
    const ukCols: AdminTableColumn<UkRow>[] = [{
      key: 'name',
      header: 'Назва',
      sortable: true,
      sortType: 'text',
      sortLabels: {
        asc: 'Сортувати A→Z',
        desc: 'Сортувати Z→A',
        hide: 'Приховати стовпець'
      },
      hideable: false,
      cell: r => <span className="font-medium break-words" title={r.name}>{r.name}</span>
    }, {
      key: 'status',
      header: 'Статус',
      sortable: false,
      hideable: true,
      sortLabels: {
        asc: 'A→Z',
        desc: 'Z→A',
        hide: 'Приховати стовпець'
      },
      onHideColumn: () => {},
      cell: r => <Badge variant={ukStatusVariant(r.statusCode)}>{r.status}</Badge>
    }];
    return <div className="space-y-4">\r
        <AdminTable rows={UK_ROWS} columns={ukCols} rowKey={r => r.id} emptyState="Немає записів." ariaLabel="Таблиця оголошень" onRowClick={setSelected} />\r
        {selected ? <div className="rounded-xl border bg-card p-4 space-y-1.5">\r
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Вибраний запис</p>\r
            <p className="text-sm font-medium break-words">{selected.name}</p>\r
            <Badge variant={ukStatusVariant(selected.statusCode)} className="text-xs">{selected.status}</Badge>\r
          </div> : <p className="text-xs text-muted-foreground italic px-1">\r
            Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан.\r
          </p>}\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(te=j.parameters)===null||te===void 0||(ee=te.docs)===null||ee===void 0?void 0:ee.source}}};A.parameters={...A.parameters,docs:{...(oe=A.parameters)===null||oe===void 0?void 0:oe.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Empty state. No rows → no chevrons, no sort affordances active. ' + 'Type in the search box to trigger the "No records match the search" empty state.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const L = makeLabels(locale);
    const cols: AdminTableColumn<SampleRow>[] = [{
      key: 'name',
      header: L.colName,
      sortable: true,
      sortType: 'text',
      hideable: false,
      cell: r => r.name
    }, {
      key: 'state',
      header: L.colStatus,
      sortable: true,
      sortType: 'text',
      hideable: true,
      cell: r => r.state
    }, {
      key: 'role',
      header: L.colRole,
      sortable: true,
      sortType: 'text',
      hideable: true,
      visibility: 'sm',
      cell: r => r.role
    }, {
      key: 'created',
      header: L.colCreated,
      sortable: true,
      sortType: 'date',
      hideable: true,
      visibility: 'xl',
      cell: r => r.created
    }];
    return <AdminTable rows={[]} columns={cols} rowKey={r => r.id} emptyState={L.noData} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(re=A.parameters)===null||re===void 0||(ae=re.docs)===null||ae===void 0?void 0:ae.source}}};R.parameters={...R.parameters,docs:{...(se=R.parameters)===null||se===void 0?void 0:se.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton — animate-pulse rows. No active affordances.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const L = makeLabels(locale);
    const cols: AdminTableColumn<SampleRow>[] = [{
      key: 'name',
      header: L.colName,
      sortable: true,
      sortType: 'text',
      hideable: false,
      cell: r => r.name
    }, {
      key: 'state',
      header: L.colStatus,
      sortable: true,
      sortType: 'text',
      hideable: true,
      cell: r => r.state
    }, {
      key: 'role',
      header: L.colRole,
      sortable: true,
      sortType: 'text',
      hideable: true,
      visibility: 'sm',
      cell: r => r.role
    }];
    return <AdminTable rows={[]} columns={cols} rowKey={r => r.id} emptyState={L.noData} loading />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(ne=R.parameters)===null||ne===void 0||(le=ne.docs)===null||le===void 0?void 0:le.source}}};const Tt=["Default","ColumnMenu","ManageColumns","CardMode","Interactive","InteractiveCardMode","Responsive","LocaleStress","EmptyState","LoadingState"];export{k as CardMode,w as ColumnMenu,f as Default,A as EmptyState,C as Interactive,S as InteractiveCardMode,R as LoadingState,j as LocaleStress,_ as ManageColumns,N as Responsive,Tt as __namedExportsOrder,Rt as default};
