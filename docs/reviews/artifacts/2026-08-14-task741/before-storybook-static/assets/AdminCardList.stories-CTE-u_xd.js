import{j as o,r as W}from"./iframe-BWqC60Cj.js";import{A as v}from"./AdminCardList-D2aUWl1F.js";import{B as _}from"./badge-DkqjA9o-.js";import{s as m}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./chevron-right-daoqVDRa.js";import"./createLucideIcon-DZTr3VOw.js";import"./index-D4MQtXW4.js";import"./useRenderElement-DCWLj8DQ.js";var L,N,T,E,C,R,K,A,Y,B,$,I,D,P,V,O,U,q,z,F,G;const c=(n,e="en")=>m(e,`storybook.admin_cardlist.${n}`);function g(n){return n==="open"?"warning":n==="in_progress"?"info":n==="resolved"?"success":"neutral"}const h={open:"state_open",in_progress:"state_in_progress",resolved:"state_resolved"},H={Support:"type_support",Complaint:"type_complaint"};function J({rows:n,locale:e,compact:a}){const[t,l]=W.useState(null),d=i=>{var u;return c((u=h[i])!==null&&u!==void 0?u:`state_${i}`,e)},r=i=>{var u;return i?c((u=H[i])!==null&&u!==void 0?u:`type_${i.toLowerCase()}`,e):void 0},s=c("hint",e),p=c("selected",e),M=c("empty",e),Q=c("aria_label",e);return o.jsxs("div",{className:"space-y-4",children:[o.jsx(v,{rows:n,rowKey:i=>i.id,card:i=>({title:i.subject,subtitle:o.jsxs("div",{className:"flex items-center gap-2 mt-1 flex-wrap",children:[o.jsx(_,{variant:g(i.state),className:"text-xs",children:d(i.state)}),r(i.type)&&o.jsx("span",{className:"text-xs text-muted-foreground",children:r(i.type)})]}),meta:i.updated?o.jsx("span",{className:"text-xs text-muted-foreground mt-0.5",children:i.updated}):void 0}),onRowClick:l,emptyState:M,ariaLabel:Q,compact:a}),t?o.jsxs("div",{className:"rounded-xl border bg-card p-4 space-y-1.5",children:[o.jsx("p",{className:"text-xs font-medium text-muted-foreground uppercase tracking-wide",children:p}),o.jsx("p",{className:"text-sm font-medium break-words",children:t.subject}),o.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[o.jsx(_,{variant:g(t.state),className:"text-xs",children:d(t.state)}),r(t.type)&&o.jsx("span",{className:"text-xs text-muted-foreground",children:r(t.type)}),t.updated&&o.jsx("span",{className:"text-xs text-muted-foreground",children:t.updated})]})]}):o.jsx("p",{className:"text-xs text-muted-foreground italic px-1",children:s})]})}function j(n){return[{id:"1",subject:m(n,"storybook.tickets.subject_0"),state:"open",type:"Support",updated:"2026-05-31"},{id:"2",subject:m(n,"storybook.tickets.subject_1"),state:"in_progress",type:"Complaint",updated:"2026-05-30"},{id:"3",subject:m(n,"storybook.tickets.subject_2"),state:"resolved",type:"Support",updated:"2026-05-29"}]}function X(n){return[{id:"1",subject:m(n,"storybook.tickets.stress_0"),state:"open"},{id:"2",subject:m(n,"storybook.tickets.stress_1"),state:"in_progress"}]}const ce={title:"Admin/AdminCardList",tags:["autodocs"],parameters:{docs:{description:{component:'Canonical card-row list for workflow-heavy admin surfaces. Interactive contract: `onRowClick` → cursor-pointer, hover:bg-muted/30, role="button", tabIndex=0, Enter/Space keyboard activation. Auto-ChevronRight affordance: when `onRowClick` is set and StructuredCard provides no `trailing`, AdminCardList automatically renders a ChevronRight. Do NOT manually add trailing: <ChevronRight /> — the primitive handles this. Explicit `trailing` (e.g. a Badge) takes precedence over auto-chevron. Static stories (no onRowClick): no hover, no cursor, no chevron. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.'}}}},x={parameters:{docs:{description:{story:'Interactive card list. State labels, type labels, hint text — all locale-reactive via toolbar. Click or Enter/Space → "Selected ticket" panel.'}}},render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return o.jsx(J,{rows:j(l),locale:l})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},b={parameters:{docs:{description:{story:"Static card list — display-only. No onRowClick → no auto-chevron, no hover, no cursor."}}},render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en",d=s=>{var p;return c((p=h[s])!==null&&p!==void 0?p:`state_${s}`,l)},r=s=>{var p;return s?c((p=H[s])!==null&&p!==void 0?p:`type_${s.toLowerCase()}`,l):void 0};return o.jsx(v,{rows:j(l),rowKey:s=>s.id,card:s=>({title:s.subject,subtitle:o.jsxs("div",{className:"flex items-center gap-2 mt-1 flex-wrap",children:[o.jsx(_,{variant:g(s.state),className:"text-xs",children:d(s.state)}),r(s.type)&&o.jsx("span",{className:"text-xs text-muted-foreground",children:r(s.type)})]}),meta:s.updated?o.jsx("span",{className:"text-xs text-muted-foreground mt-0.5",children:s.updated}):void 0}),emptyState:c("empty",l)})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},y={parameters:{docs:{description:{story:"Static compact density with explicit Badge trailing."}}},render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en",d=r=>{var s;return c((s=h[r])!==null&&s!==void 0?s:`state_${r}`,l)};return o.jsx(v,{rows:j(l),rowKey:r=>r.id,card:r=>({title:r.subject,trailing:o.jsx(_,{variant:g(r.state),className:"text-xs shrink-0",children:d(r.state)})}),emptyState:c("empty",l),compact:!0})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},w={parameters:{docs:{description:{story:"Static legacy ReactNode card (not StructuredCard) — no auto-chevron."}}},render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en",d=r=>{var s;return c((s=h[r])!==null&&s!==void 0?s:`state_${r}`,l)};return o.jsx(v,{rows:j(l),rowKey:r=>r.id,card:r=>o.jsxs("div",{className:"flex items-center justify-between",children:[o.jsx("p",{className:"font-medium text-sm min-w-0 break-words",children:r.subject}),o.jsx(_,{variant:g(r.state),className:"text-xs shrink-0 ml-2",children:d(r.state)})]}),emptyState:c("empty",l)})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},S={render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return o.jsx(v,{rows:[],rowKey:d=>d.id,card:()=>null,emptyState:c("empty",l)})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},k={render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return o.jsx(v,{rows:[],rowKey:()=>"",card:()=>null,emptyState:c("empty",l),loading:!0})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},f={parameters:{docs:{description:{story:"uk@320: long Ukrainian ticket subjects must wrap inside card bounds; auto-chevron remains visible."}}},render:(n,e)=>{var a,t;const l=(t=e==null||(a=e.globals)===null||a===void 0?void 0:a.locale)!==null&&t!==void 0?t:"en";return o.jsx(J,{rows:X(l),locale:l})},globals:{viewport:{value:"mobile320",isRotated:!1}}};x.parameters={...x.parameters,docs:{...(L=x.parameters)===null||L===void 0?void 0:L.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Interactive card list. State labels, type labels, hint text — all locale-reactive via toolbar. Click or Enter/Space → "Selected ticket" panel.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <TicketListInteractive rows={makeTickets(locale)} locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(T=x.parameters)===null||T===void 0||(N=T.docs)===null||N===void 0?void 0:N.source}}};b.parameters={...b.parameters,docs:{...(E=b.parameters)===null||E===void 0?void 0:E.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Static card list — display-only. No onRowClick → no auto-chevron, no hover, no cursor.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? \`state_\${s}\`, locale);
    const localTypeLabel = (t?: string) => t ? acl(TYPE_KEY[t] ?? \`type_\${t.toLowerCase()}\`, locale) : undefined;
    return <AdminCardList rows={makeTickets(locale)} rowKey={r => r.id} card={row => ({
      title: row.subject,
      subtitle: <div className="flex items-center gap-2 mt-1 flex-wrap">\r
              <Badge variant={stateVariant(row.state)} className="text-xs">{localStateLabel(row.state)}</Badge>\r
              {localTypeLabel(row.type) && <span className="text-xs text-muted-foreground">{localTypeLabel(row.type)}</span>}\r
            </div>,
      meta: row.updated ? <span className="text-xs text-muted-foreground mt-0.5">{row.updated}</span> : undefined
    })} emptyState={acl('empty', locale)} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(R=b.parameters)===null||R===void 0||(C=R.docs)===null||C===void 0?void 0:C.source}}};y.parameters={...y.parameters,docs:{...(K=y.parameters)===null||K===void 0?void 0:K.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Static compact density with explicit Badge trailing.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? \`state_\${s}\`, locale);
    return <AdminCardList rows={makeTickets(locale)} rowKey={r => r.id} card={row => ({
      title: row.subject,
      trailing: <Badge variant={stateVariant(row.state)} className="text-xs shrink-0">{localStateLabel(row.state)}</Badge>
    })} emptyState={acl('empty', locale)} compact />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(Y=y.parameters)===null||Y===void 0||(A=Y.docs)===null||A===void 0?void 0:A.source}}};w.parameters={...w.parameters,docs:{...(B=w.parameters)===null||B===void 0?void 0:B.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Static legacy ReactNode card (not StructuredCard) — no auto-chevron.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const localStateLabel = (s: string) => acl(STATE_KEY[s] ?? \`state_\${s}\`, locale);
    return <AdminCardList rows={makeTickets(locale)} rowKey={r => r.id} card={row => <div className="flex items-center justify-between">\r
            <p className="font-medium text-sm min-w-0 break-words">{row.subject}</p>\r
            <Badge variant={stateVariant(row.state)} className="text-xs shrink-0 ml-2">{localStateLabel(row.state)}</Badge>\r
          </div>} emptyState={acl('empty', locale)} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(I=w.parameters)===null||I===void 0||($=I.docs)===null||$===void 0?void 0:$.source}}};S.parameters={...S.parameters,docs:{...(D=S.parameters)===null||D===void 0?void 0:D.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminCardList rows={[]} rowKey={r => (r as TicketRow).id} card={() => null} emptyState={acl('empty', locale)} />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(V=S.parameters)===null||V===void 0||(P=V.docs)===null||P===void 0?void 0:P.source}}};k.parameters={...k.parameters,docs:{...(O=k.parameters)===null||O===void 0?void 0:O.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminCardList rows={[]} rowKey={() => ''} card={() => null} emptyState={acl('empty', locale)} loading />;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(q=k.parameters)===null||q===void 0||(U=q.docs)===null||U===void 0?void 0:U.source}}};f.parameters={...f.parameters,docs:{...(z=f.parameters)===null||z===void 0?void 0:z.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@320: long Ukrainian ticket subjects must wrap inside card bounds; auto-chevron remains visible.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <TicketListInteractive rows={makeStressTickets(locale)} locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(G=f.parameters)===null||G===void 0||(F=G.docs)===null||F===void 0?void 0:F.source}}};const de=["Default","Static","Compact","LegacyReactNode","Empty","Loading","LocaleStress"];export{y as Compact,x as Default,S as Empty,w as LegacyReactNode,k as Loading,f as LocaleStress,b as Static,de as __namedExportsOrder,ce as default};
