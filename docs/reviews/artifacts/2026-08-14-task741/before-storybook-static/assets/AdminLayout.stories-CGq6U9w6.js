import{j as e,r as K}from"./iframe-BWqC60Cj.js";import{B as u}from"./button-DqckHWPj.js";import{I as B}from"./input-ByZEYirH.js";import{B as S}from"./badge-DkqjA9o-.js";import{S as p}from"./skeleton-BBWIc5OI.js";import{s as C}from"./_storyI18n-DUPbxmag.js";import{P as k}from"./plus-Cc25WxNA.js";import{S as F}from"./search-D3-0jNs5.js";import{F as R}from"./funnel-BcadKEg1.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./useControlled-COCwHvrc.js";import"./shadowDom-KUr5fxLu.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./createLucideIcon-DZTr3VOw.js";var x,g,v,b,_,h,f,A,N,j,w,y;const{fn:T}=__STORYBOOK_MODULE_TEST__,E={add_lst:"add_listing",add_usr:"add_user",col_name:"col_name",col_role:"col_role",col_status:"col_status",col_actions:"col_actions",role_agent:"role_agent",role_user:"role_user",role_admin:"role_admin",total_lst:"total_listings",search_ph:"search_ph"},r=(l,a="en")=>{var s;return C(a,`storybook.adminlayout.${(s=E[l])!==null&&s!==void 0?s:l}`)},de={title:"System/AdminLayout",tags:["autodocs"],parameters:{docs:{description:{component:"Admin layout patterns — toolbar, table wrapper, card. See docs/tailwind-canonical-fragments.md §5 for admin table wrapper."}}}};function W({onFilter:l,onAddListing:a,locale:s="en"}){const[d,o]=K.useState(null);return e.jsxs("div",{"data-testid":"admin-toolbar",className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-6 border-b bg-card rounded-t-2xl gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("h2",{className:"text-lg font-semibold",children:r("listings",s)}),e.jsx(S,{variant:"secondary",children:"1,248"})]}),e.jsxs("div",{className:"flex flex-col md:flex-row md:flex-wrap md:items-center gap-2",children:[e.jsxs("div",{className:"relative",children:[e.jsx(F,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0"}),e.jsx(B,{type:"search",placeholder:r("search_ph",s),className:"pl-9 h-9 w-full md:w-48"})]}),e.jsxs(u,{variant:"outline",size:"default",className:"max-md:w-full",onClick:()=>{l==null||l(),o(r("filter",s))},children:[e.jsx(R,{className:"h-4 w-4 shrink-0"}),r("filter",s)]}),e.jsxs(u,{size:"default",className:"max-md:w-full",onClick:()=>{a==null||a(),o(r("add_lst",s))},children:[e.jsx(k,{className:"shrink-0"}),r("add_lst",s)]})]})]}),d&&e.jsx("p",{className:"text-xs text-muted-foreground px-1",children:d})]})}const n={args:{onFilter:T(),onAddListing:T()},render:(l,a)=>{var s,d;return e.jsx(W,{onFilter:l.onFilter,onAddListing:l.onAddListing,locale:(d=a==null||(s=a.globals)===null||s===void 0?void 0:s.locale)!==null&&d!==void 0?d:"en"})},parameters:{docs:{description:{story:"Admin toolbar: canonical Input (not raw input), canonical Button. Clicking Filter/Add logs to Actions panel via fn() AND shows in-canvas label."}}}};function D({onAddUser:l,locale:a="en"}){const[s,d]=K.useState(null);return e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"bg-card rounded-2xl border shadow-sm overflow-hidden max-w-6xl mx-auto",children:[e.jsxs("div",{className:"flex items-center justify-between p-4 md:p-6 border-b",children:[e.jsx("h2",{className:"text-lg font-semibold",children:r("users",a)}),e.jsxs(u,{size:"default",onClick:()=>{l==null||l(),d(r("add_usr",a))},children:[e.jsx(k,{})," ",r("add_usr",a)]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-muted/50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-left px-4 py-3 font-medium text-muted-foreground",children:r("col_name",a)}),e.jsx("th",{className:"text-left px-4 py-3 font-medium text-muted-foreground",children:r("col_role",a)}),e.jsx("th",{className:"text-left px-4 py-3 font-medium text-muted-foreground",children:r("col_status",a)}),e.jsx("th",{className:"text-left px-4 py-3 font-medium text-muted-foreground",children:r("col_actions",a)})]})}),e.jsx("tbody",{className:"divide-y",children:[{name:"Ana Koci",role:r("role_agent",a)},{name:"Blerim Hoxha",role:r("role_user",a)},{name:"Flutura Lleshi",role:r("role_admin",a)}].map(o=>e.jsxs("tr",{className:"hover:bg-muted/30",children:[e.jsx("td",{className:"px-4 py-3",children:o.name}),e.jsx("td",{className:"px-4 py-3 text-muted-foreground",children:o.role}),e.jsx("td",{className:"px-4 py-3",children:e.jsx(S,{variant:"success",children:r("active",a)})}),e.jsx("td",{className:"px-4 py-3",children:e.jsx(u,{size:"xs",variant:"ghost",children:r("edit",a)})})]},o.name))})]})})]}),s&&e.jsx("p",{className:"text-xs text-muted-foreground px-1",children:s})]})}const i={args:{onAddUser:T()},render:(l,a)=>{var s,d;return e.jsx(D,{onAddUser:l.onAddUser,locale:(d=a==null||(s=a.globals)===null||s===void 0?void 0:s.locale)!==null&&d!==void 0?d:"en"})},parameters:{docs:{description:{story:'Admin table wrapper: `bg-card rounded-2xl border shadow-sm overflow-hidden` + `overflow-x-auto` for mobile scroll. "Add user" button logs to Actions panel via fn() AND shows in-canvas label.'}}}},c={render:(l,a)=>{var s,d;const o=(d=a==null||(s=a.globals)===null||s===void 0?void 0:s.locale)!==null&&d!==void 0?d:"en",L=[{labelKey:"total_lst",value:"1,248",badge:"success",badgeText:"+12%"},{labelKey:"active",value:"934",badge:"success",badgeText:r("live",o)},{labelKey:"pending",value:"87",badge:"warning",badgeText:r("review",o)},{labelKey:"users",value:"3,421",badge:"info",badgeText:"+8%"},{labelKey:"agents",value:"156",badge:"info",badgeText:r("verified",o)},{labelKey:"revenue",value:"€42k",badge:"success",badgeText:"+23%"}];return e.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-6xl mx-auto",children:L.map(t=>e.jsxs("div",{className:"bg-card rounded-2xl border shadow-sm p-5",children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:r(t.labelKey,o)}),e.jsx("p",{className:"text-2xl font-bold mt-1",children:t.value}),e.jsx(S,{variant:t.badge,className:"mt-2",children:t.badgeText})]},t.labelKey))})},parameters:{docs:{description:{story:"Admin stat cards: `bg-card rounded-2xl border shadow-sm p-5` — canonical admin card pattern (26+ occurrences)."}}},globals:{viewport:{value:"desktop1280",isRotated:!1}}},m={render:()=>e.jsx("div",{className:"space-y-4 max-w-6xl mx-auto",children:e.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",children:Array.from({length:6}).map((l,a)=>e.jsxs("div",{className:"bg-card rounded-2xl border shadow-sm p-5 space-y-2",children:[e.jsx(p,{className:"h-3 w-2/3"}),e.jsx(p,{className:"h-7 w-1/2"}),e.jsx(p,{className:"h-4 w-16 rounded-full"})]},a))})})};n.parameters={...n.parameters,docs:{...(x=n.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  args: {
    onFilter: fn(),
    onAddListing: fn()
  },
  render: (args, context) => <AdminToolbarRender onFilter={args.onFilter} onAddListing={args.onAddListing} locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Admin toolbar: canonical Input (not raw input), canonical Button. Clicking Filter/Add logs to Actions panel via fn() AND shows in-canvas label.'
      }
    }
  }
}`,...(v=n.parameters)===null||v===void 0||(g=v.docs)===null||g===void 0?void 0:g.source}}};i.parameters={...i.parameters,docs:{...(b=i.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  args: {
    onAddUser: fn()
  },
  render: (args, context) => <AdminTableWrapperRender onAddUser={args.onAddUser} locale={context?.globals?.locale as string ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Admin table wrapper: \`bg-card rounded-2xl border shadow-sm overflow-hidden\` + \`overflow-x-auto\` for mobile scroll. "Add user" button logs to Actions panel via fn() AND shows in-canvas label.'
      }
    }
  }
}`,...(h=i.parameters)===null||h===void 0||(_=h.docs)===null||_===void 0?void 0:_.source}}};c.parameters={...c.parameters,docs:{...(f=c.parameters)===null||f===void 0?void 0:f.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const cards = [{
      labelKey: 'total_lst',
      value: '1,248',
      badge: 'success' as const,
      badgeText: '+12%'
    }, {
      labelKey: 'active',
      value: '934',
      badge: 'success' as const,
      badgeText: al('live', l)
    }, {
      labelKey: 'pending',
      value: '87',
      badge: 'warning' as const,
      badgeText: al('review', l)
    }, {
      labelKey: 'users',
      value: '3,421',
      badge: 'info' as const,
      badgeText: '+8%'
    }, {
      labelKey: 'agents',
      value: '156',
      badge: 'info' as const,
      badgeText: al('verified', l)
    }, {
      labelKey: 'revenue',
      value: '\\u20ac42k',
      badge: 'success' as const,
      badgeText: '+23%'
    }];
    return <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-6xl mx-auto">\r
      {cards.map(card => <div key={card.labelKey} className="bg-card rounded-2xl border shadow-sm p-5">\r
          <p className="text-xs text-muted-foreground">{al(card.labelKey, l)}</p>\r
          <p className="text-2xl font-bold mt-1">{card.value}</p>\r
          <Badge variant={card.badge} className="mt-2">{card.badgeText}</Badge>\r
        </div>)}\r
    </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin stat cards: \`bg-card rounded-2xl border shadow-sm p-5\` — canonical admin card pattern (26+ occurrences).'
      }
    }
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(N=c.parameters)===null||N===void 0||(A=N.docs)===null||A===void 0?void 0:A.source}}};m.parameters={...m.parameters,docs:{...(j=m.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 max-w-6xl mx-auto">\r
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">\r
        {Array.from({
        length: 6
      }).map((_, i) => <div key={i} className="bg-card rounded-2xl border shadow-sm p-5 space-y-2">\r
            <Skeleton className="h-3 w-2/3" />\r
            <Skeleton className="h-7 w-1/2" />\r
            <Skeleton className="h-4 w-16 rounded-full" />\r
          </div>)}\r
      </div>\r
    </div>
}`,...(y=m.parameters)===null||y===void 0||(w=y.docs)===null||w===void 0?void 0:w.source}}};const oe=["AdminToolbar","AdminTableWrapper","AdminCards","AdminLoadingState"];export{c as AdminCards,m as AdminLoadingState,i as AdminTableWrapper,n as AdminToolbar,oe as __namedExportsOrder,de as default};
